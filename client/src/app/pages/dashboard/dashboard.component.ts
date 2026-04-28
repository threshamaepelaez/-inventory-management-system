import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';

interface Product {
  id: number;
  name: string;
  quantity: number;
  category?: { name: string } | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalProducts = 0;
  lowStockItems = 0;
  categoriesCount = 0;
  currentUserName = '';
  private subscription: Subscription | null = null;

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUserName = this.authService.getCurrentUser()?.name || 'User';

    this.subscription = this.productService.getProducts().subscribe({
      next: (response) => {
        const products: Product[] = response.products || [];
        this.totalProducts = products.length;
        this.lowStockItems = products.filter((p: Product) => p.quantity < 5).length;
        const categorySet = new Set(products.map((p: Product) => p.category?.name));
        this.categoriesCount = categorySet.size;
      },
      error: (err) => {
        console.error('Error fetching products:', err);
        // Fallback values so dashboard doesn’t stay stuck loading
        this.totalProducts = 0;
        this.lowStockItems = 0;
        this.categoriesCount = 0;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
