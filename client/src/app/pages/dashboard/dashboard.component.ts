import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';

interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  categoryCount: number;
}

interface Product {
  id: number;
  name: string;
  description?: string | null;
  category?: string | null;
  quantity: number;
  price: number;
  imageUrl?: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalProducts = 0;
  lowStockItems = 0;
  categoriesCount = 0;
  totalStockValue = 0;
  currentUserName = '';
  currentDate = '';
  isLoading = true;
  errorMessage = '';
  recentProducts: Product[] = [];

  private subscription: Subscription | null = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    this.currentUserName = this.authService.getCurrentUser()?.name || 'User';
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.subscription = this.productService.getDashboardStats().subscribe({
      next: (response: DashboardStats) => {
        this.totalProducts = response?.totalProducts ?? 0;
        this.lowStockItems = response?.lowStockCount ?? 0;
        this.categoriesCount = response?.categoryCount ?? 0;
        this.totalStockValue = response?.totalStockValue ?? 0;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading dashboard stats:', err);
        this.errorMessage = err?.error?.message || 'Failed to load dashboard data. Please try again.';
        this.totalProducts = 0;
        this.lowStockItems = 0;
        this.categoriesCount = 0;
        this.totalStockValue = 0;
        this.isLoading = false;
      }
    });

    this.loadRecentProducts();
  }

  loadRecentProducts(): void {
    this.productService.getProducts(1, 5).subscribe({
      next: (response: any) => {
        if (response && response.products) {
          this.recentProducts = response.products;
        } else if (Array.isArray(response)) {
          this.recentProducts = response.slice(0, 5);
        } else {
          this.recentProducts = [];
        }
      },
      error: (err) => {
        console.error('Error loading recent products:', err);
        this.recentProducts = [];
      }
    });
  }

  getQuantityClass(quantity: number): string {
    if (quantity === 0) {
      return 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700';
    } else if (quantity < 10) {
      return 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-amber-700';
    }
    return 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700';
  }

  getStockStatusLabel(quantity: number): string {
    if (quantity === 0) {
      return 'Out of Stock';
    } else if (quantity < 10) {
      return 'Low Stock';
    }
    return 'In Stock';
  }

  viewLowStock(): void {
    this.router.navigate(['/products'], { queryParams: { lowStock: 'true' } });
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
