import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = 'http://localhost:5000/api/products';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Get products with optional category filter
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Search term (optional)
   * @param category - Category filter (optional, e.g., 'fashions', 'Gadgets')
   */
  getProducts(page: number = 1, limit: number = 10, search?: string, category?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    // Add search param only if not empty string
    if (search && search.trim() !== '') {
      params = params.set('search', search);
    }
    
    // Add category param only if not empty string and not 'All'
    // This ensures exact match with database category values
    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      params = params.set('category', category.trim());
      console.log('=== PRODUCT SERVICE ===');
      console.log('Sending category filter:', category);
      console.log('======================');
    } else {
      console.log('=== PRODUCT SERVICE ===');
      console.log('No category filter (All products)');
      console.log('======================');
    }
    
    return this.http.get(this.baseUrl, { 
      headers: this.getHeaders(),
      params: params 
    });
  }

  /**
   * Get products filtered by category
   * @param category - Category name to filter by
   */
  getProductsByCategory(category: string): Observable<any> {
    return this.getProducts(1, 100, '', category);
  }

  getProductById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  createProduct(formData: FormData): Observable<any> {
    // For FormData, don't set Content-Type manually - let Angular set it with boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.post(this.baseUrl, formData, { headers });
  }

  updateProduct(id: number, formData: FormData): Observable<any> {
    // For FormData, don't set Content-Type manually - let Angular set it with boundary
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    return this.http.put(`${this.baseUrl}/${id}`, formData, { headers });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, { headers: this.getHeaders() });
  }

  getLowStockProducts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/low-stock`, { headers: this.getHeaders() });
  }

  /**
   * Get all categories from the backend
   */
  getCategories(): Observable<any> {
    return this.http.get('http://localhost:5000/api/categories', { 
      headers: this.getHeaders() 
    }).pipe(
      catchError((error) => {
        console.error('=== GET CATEGORIES ERROR ===');
        console.error('Error:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('=====================================');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get dashboard statistics
   * Returns total products, low stock count, and category count
   */
  getDashboardStats(): Observable<any> {
    return this.http.get('http://localhost:5000/api/dashboard/stats', { 
      headers: this.getHeaders() 
    }).pipe(
      catchError((error) => {
        console.error('=== GET DASHBOARD STATS ERROR ===');
        console.error('Error:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('=====================================');
        // Re-throw the error so the component can handle it
        return throwError(() => error);
      })
    );
  }

  /**
   * Get inventory logs
   * Returns the last 20 inventory log entries with product and user info
   */
  getInventoryLogs(): Observable<any> {
    return this.http.get('http://localhost:5000/api/dashboard/logs', { 
      headers: this.getHeaders() 
    }).pipe(
      catchError((error) => {
        console.error('=== GET INVENTORY LOGS ERROR ===');
        console.error('Error:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('=====================================');
        return throwError(() => error);
      })
    );
  }
}