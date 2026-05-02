import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, BehaviorSubject, timeout, catchError, takeUntil, switchMap, debounceTime } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { AuthService } from '../../../services/auth.service';

interface Product {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  category_id?: number | null;
  Category?: { name: string } | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule],
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  searchTerm: string = '';
  categoryFilter: string = '';
  selectedCategory: string = '';
  categories: string[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  total: number = 0;
  limit: number = 10;
  isLoading: boolean = true;
  isAdmin: boolean = false;
  errorMessage: string = '';
  lowStockFilter: boolean = false;
  
  // BehaviorSubject for selected category - triggers new API call when changed
  private categorySubject = new BehaviorSubject<string>('');
  
  // Subscription management
  private destroy$ = new Subject<void>();
  private productsSubscription: any = null;
  private timeoutId: any = null;
  private categorySubscription: any = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {}

  // Helper method to get category display name
  getCategoryName(product: Product): string {
    // First check for nested Category object (from Sequelize include)
    if (product.Category && product.Category.name) {
      return product.Category.name;
    }
    // Then check for direct category field
    if (product.category) {
      return product.category;
    }
    // Then check for category_id (could lookup from categories array)
    if (product.category_id) {
      return 'Category ID: ' + product.category_id;
    }
    return 'N/A';
  }

  // Computed properties for stats
  get totalStockValue(): number {
    return this.products.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  }

  get outOfStockCount(): number {
    return this.products.filter(p => p.quantity === 0).length;
  }

  // Helper method to get category color class
  getCategoryColorClass(category: string | null | undefined): string {
    const cat = (category || '').toLowerCase();
    const colorMap: { [key: string]: string } = {
      'electronics': 'bg-blue-100 text-blue-700',
      'fashion': 'bg-pink-100 text-pink-700',
      'home & living': 'bg-amber-100 text-amber-700',
      'gadgets': 'bg-purple-100 text-purple-700',
      'food & beverage': 'bg-green-100 text-green-700',
      'sports': 'bg-orange-100 text-orange-700',
      'books': 'bg-indigo-100 text-indigo-700',
      'clothing': 'bg-rose-100 text-rose-700',
      'toys': 'bg-yellow-100 text-yellow-700',
      'other': 'bg-slate-100 text-slate-700'
    };
    return colorMap[cat] || 'bg-slate-100 text-slate-700';
  }

  // Helper method to get stock status badge class
  getStockStatusBadgeClass(quantity: number): string {
    if (quantity === 0) {
      return 'bg-red-100 text-red-700';
    } else if (quantity <= 9) {
      return 'bg-yellow-100 text-yellow-700';
    } else {
      return 'bg-green-100 text-green-700';
    }
  }

  // Helper method to get stock status dot class
  getStockStatusDotClass(quantity: number): string {
    if (quantity === 0) {
      return 'bg-red-500';
    } else if (quantity <= 9) {
      return 'bg-yellow-500';
    } else {
      return 'bg-green-500';
    }
  }

  // Get page numbers for pagination
  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      if (!pages.includes(this.totalPages)) {
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  // Go to specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProducts(this.currentPage, this.limit, this.searchTerm, this.categoryFilter);
    }
  }

  // Helper method to get stock status label
  getStockStatusLabel(quantity: number): string {
    if (quantity === 0) {
      return 'Out of Stock';
    } else if (quantity <= 10) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isLoading = true;
    this.errorMessage = '';

    // Load categories from backend first, then load products
    this.loadCategories();

    // Subscribe to category changes - triggers new API call when category changes
    this.categorySubscription = this.categorySubject.pipe(
      debounceTime(300), // Wait 300ms after last change
      takeUntil(this.destroy$)
    ).subscribe((category: string) => {
      console.log('Category changed, reloading products with:', category);
      this.loadProducts(1, this.limit, this.searchTerm, category);
    });

    // Check for filter query parameter from dashboard
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'low-stock') {
        this.lowStockFilter = true;
        this.categoryFilter = 'lowStock';
        this.selectedCategory = 'lowStock';
        this.loadProducts(1, this.limit, '', 'lowStock');
      } else {
        this.lowStockFilter = false;
        // Initial load without any filters
        this.loadProducts(1, 10, '', '');
      }
    });
  }

  // Load categories from the backend API
  loadCategories(): void {
    this.productService.getCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        console.log('Categories response:', response);
        
        // Handle different response formats
        let categoriesArray: any[] = [];
        
        if (Array.isArray(response)) {
          categoriesArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          categoriesArray = response.data;
        } else if (response && response.categories) {
          categoriesArray = response.categories;
        }
        
        // Extract category names from the response
        this.categories = categoriesArray.map((cat: any) => {
          if (typeof cat === 'string') {
            return cat;
          } else if (cat && cat.name) {
            return cat.name;
          }
          return '';
        }).filter((c: string) => c !== '');
        
        console.log('Loaded categories:', this.categories);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        // Fallback to empty array - products will still show without category filter
        this.categories = [];
      }
    });
  }

  loadProducts(page: number = this.currentPage, limit: number = this.limit, search: string = this.searchTerm, category: string = this.selectedCategory): void {
    // Cancel any previous API call
    this.cancelPendingRequests();
    
    this.isLoading = true;
    this.errorMessage = '';

    // Console.log the selectedCategory value before making the API call
    console.log('=== LOAD PRODUCTS ===');
    console.log('selectedCategory:', this.selectedCategory);
    console.log('category param:', category);
    console.log('categoryFilter:', this.categoryFilter);
    console.log('====================');

    // Check if this is a low stock filter request
    if (category === 'lowStock' || this.categoryFilter === 'lowStock') {
      this.productsSubscription = this.productService.getLowStockProducts().pipe(
        timeout(10000),
        takeUntil(this.destroy$),
        catchError((err) => {
          console.error('Error or timeout loading low stock products:', err);
          this.isLoading = false;
          if (err.name === 'TimeoutError') {
            this.errorMessage = 'Request timed out. Please try again.';
          } else {
            this.errorMessage = 'Failed to load products. Please try again.';
          }
          this.products = [];
          throw err;
        })
      ).subscribe({
        next: (response: any) => {
          this.clearTimeout();
          
          console.log('Low stock products response:', response);
          
          let productsArray: Product[] = [];
          
          if (Array.isArray(response)) {
            productsArray = response;
          } else if (response && response.products) {
            productsArray = response.products;
          } else if (response && response.data && Array.isArray(response.data)) {
            productsArray = response.data;
          }

          this.products = productsArray;
          this.total = productsArray.length;
          this.totalPages = 1;
          
          this.isLoading = false;
          this.productsSubscription = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading low stock products:', err);
        }
      });
      return;
    }

    // Make the API call with timeout
    this.productsSubscription = this.productService.getProducts(page, limit, search, category).pipe(
      timeout(10000), // 10 second timeout
      takeUntil(this.destroy$),
      catchError((err) => {
        console.error('Error or timeout loading products:', err);
        this.isLoading = false;
        if (err.name === 'TimeoutError') {
          this.errorMessage = 'Request timed out. Please try again.';
        } else {
          this.errorMessage = 'Failed to load products. Please try again.';
        }
        this.products = [];
        throw err;
      })
    ).subscribe({
      next: (response: any) => {
        // Clear timeout since we got a response
        this.clearTimeout();
        
        console.log('Full API response:', response);
        
        // Handle different response formats: response.products, response.data, response.rows, or direct array
        let productsArray: Product[] = [];
        
        if (Array.isArray(response)) {
          // Direct array response
          productsArray = response;
        } else if (response && response.products) {
          // { products: [...], pagination: {...} }
          productsArray = response.products;
        } else if (response && response.data && Array.isArray(response.data)) {
          // { data: [...], pagination: {...} }
          productsArray = response.data;
        } else if (response && response.data && response.data.products) {
          // { data: { products: [...] } }
          productsArray = response.data.products;
        } else if (response && response.rows) {
          // { rows: [...], pagination: {...} }
          productsArray = response.rows;
        }

        this.products = productsArray;
        
        // Handle pagination if available
        if (response && response.pagination) {
          this.total = response.pagination.total || 0;
          this.totalPages = response.pagination.totalPages || 1;
        } else if (response && response.data && response.data.pagination) {
          this.total = response.data.pagination.total || 0;
          this.totalPages = response.data.pagination.totalPages || 1;
        } else {
          this.total = productsArray.length;
          this.totalPages = 1;
        }
        
        // Extract unique categories - check nested Category object first
        const uniqueCategories = new Set<string>();
        this.products.forEach((p: Product) => {
          if (p.Category && p.Category.name) {
            uniqueCategories.add(p.Category.name);
          } else if (p.category) {
            uniqueCategories.add(p.category);
          }
        });
        this.categories = Array.from(uniqueCategories);
        
        this.isLoading = false;
        this.productsSubscription = null;
        // Force change detection to update the view
        this.cdr.detectChanges();
      },
      error: (err) => {
        // Error is already handled in the pipe catchError
        console.error('Error loading products:', err);
      }
    });
  }

  // Cancel any pending requests
  private cancelPendingRequests(): void {
    if (this.productsSubscription) {
      this.productsSubscription.unsubscribe?.();
      this.productsSubscription = null;
    }
    this.clearTimeout();
  }

  // Clear timeout
  private clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    // When Search button is clicked, call loadProducts() with the selectedCategory
    this.loadProducts(1, this.limit, this.searchTerm, this.selectedCategory);
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    // When the dropdown (select) value changes, update the BehaviorSubject
    // This will trigger a new API call automatically
    this.selectedCategory = this.categoryFilter;
    console.log('Category changed to:', this.selectedCategory);
    this.categorySubject.next(this.selectedCategory);
  }

  // Set category from button click
  setCategory(category: string): void {
    this.currentPage = 1;
    this.categoryFilter = category;
    this.selectedCategory = category;
    console.log('=== SET CATEGORY ===');
    console.log('Category set to:', category);
    console.log('categoryFilter:', this.categoryFilter);
    console.log('selectedCategory:', this.selectedCategory);
    console.log('====================');
    // Trigger API call via BehaviorSubject
    this.categorySubject.next(category);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts(this.currentPage, this.limit, this.searchTerm, this.categoryFilter);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts(this.currentPage, this.limit, this.searchTerm, this.categoryFilter);
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.loadProducts(this.currentPage, this.limit, this.searchTerm, this.categoryFilter);
        },
        error: (err) => {
          alert('Error deleting product: ' + err.error?.message);
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.cancelPendingRequests();
    this.categorySubscription?.unsubscribe();
    this.categorySubject.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }
}