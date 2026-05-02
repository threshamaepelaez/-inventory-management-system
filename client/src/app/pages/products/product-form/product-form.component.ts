import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode: boolean = false;
  productId: number | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  
  // Fixed categories list
  categories: string[] = ['Electronics', 'Fashion', 'Home & Living', 'Gadgets', 'Food & Beverage', 'Sports', 'Books', 'Clothing', 'Toys', 'Other'];



  // Getter to check if category is selected
  get isCategorySelected(): boolean {
    const category = this.productForm.get('category')?.value;
    return category !== null && category !== '';
  }

  // Getter to check if form has required fields filled (name, quantity, price)
  get canSubmit(): boolean {
    const name = this.productForm.get('name')?.value;
    const quantity = this.productForm.get('quantity')?.value;
    const price = this.productForm.get('price')?.value;
    return !!(name && quantity !== null && quantity !== '' && price !== null && price !== '');
  }

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: [''],
      quantity: [null, [Validators.required, Validators.min(0)]],
      price: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
  }

  loadProduct(): void {
    if (!this.productId) return;
    
    this.isLoading = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (product) => {
        this.productForm.patchValue({
          name: product.name,
          description: product.description || '',
          category: product.category || '',
          quantity: product.quantity,
          price: product.price
        });
        if (product.imageUrl) {
          this.imagePreview = 'http://localhost:5000' + product.imageUrl;
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error loading product';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onSubmit(): void {
    // Check required fields: name, quantity, price
    const name = this.productForm.get('name')?.value;
    const quantity = this.productForm.get('quantity')?.value;
    const price = this.productForm.get('price')?.value;

    if (!name || !quantity || !price) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', this.productForm.get('description')?.value || '');
    formData.append('category', this.productForm.get('category')?.value || '');
    formData.append('quantity', String(quantity));
    formData.append('price', String(price));

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    // Log FormData contents for debugging
    console.log('=== PRODUCT FORM DATA ===');
    console.log('name:', name);
    console.log('description:', this.productForm.get('description')?.value);
    console.log('category:', this.productForm.get('category')?.value);
    console.log('quantity:', quantity);
    console.log('price:', price);
    console.log('image:', this.selectedFile?.name || 'no file');
    console.log('=========================');

    const request = this.isEditMode && this.productId
      ? this.productService.updateProduct(this.productId, formData)
      : this.productService.createProduct(formData);

    request.subscribe({
      next: (response) => {
        console.log('Product saved successfully:', response);
        this.isLoading = false;
        this.router.navigate(['/products']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving product:', error);
        alert(error.error?.message || 'Error saving product: ' + (error.message || 'Unknown error'));
      }
    });
  }
}