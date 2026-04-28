import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  searchTerm: string = '';
  categoryFilter: string = '';
  categories: string[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  total: number = 0;
  limit: number = 10;
  isLoading: boolean = true;
  isAdmin: boolean = false;
  errorMessage: string = '';

  constructor(
    private productService: ProductService,
    private authService: AuthService
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

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts(1, 10, '', '').subscribe({
      next: (response: any) => {
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
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to load products. Please try again.';
        this.products = [];
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProducts(this.currentPage, this.limit, this.searchTerm, this.categoryFilter).subscribe({
      next: (response: any) => {
        // Handle different response formats: response.products, response.data, or direct array
        let productsArray: Product[] = [];
        
        if (Array.isArray(response)) {
          productsArray = response;
        } else if (response && response.products) {
          productsArray = response.products;
        } else if (response && response.data && Array.isArray(response.data)) {
          productsArray = response.data;
        } else if (response && response.data && response.data.products) {
          productsArray = response.data.products;
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
        
        // Extract unique categories
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
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoading = false;
        this.errorMessage = 'Failed to load products. Please try again.';
        this.products = [];
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  onCategoryChange(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  deleteProduct(id: number): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          alert('Error deleting product: ' + err.error?.message);
        }
      });
    }
  }
}