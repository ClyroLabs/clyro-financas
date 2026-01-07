import { Injectable, inject } from '@angular/core';
import { AdminService } from './admin.service';

export interface GatePayOrderRequest {
  orderId: string;
  amount: number;
  currency: 'USD'; // Assuming GatePay operates in USD
  productName: string;
  productDesc: string;
  redirectUrl: string;
}

export interface GatePayOrderResponse {
  success: boolean;
  orderId: string;
  paymentUrl?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GatePayService {
  private adminService = inject(AdminService);

  constructor() { }

  /**
   * In a real application, this method would make a server-side request
   * to GatePay's API to create a payment order. The server would use the
   * API secret to sign the request.
   *
   * For this simulation, we'll just mock the response.
   */
  async createOrder(request: GatePayOrderRequest): Promise<GatePayOrderResponse> {
    const settings = this.adminService.settings();
    
    console.log('Creating GatePay order with:', {
      clientId: settings.gatePayClientId,
      ...request
    });

    return new Promise(resolve => {
      setTimeout(() => {
        if (!settings.gatePayClientId || !settings.gatePayApiKey || !settings.gatePayApiSecret) {
          resolve({
            success: false,
            orderId: request.orderId,
            error: 'GatePay credentials are not configured in admin settings.'
          });
          return;
        }

        // Simulate a successful API call
        const paymentUrl = `https://mock-gatepay.com/payment?orderId=${request.orderId}&clientId=${settings.gatePayClientId}`;
        
        resolve({
          success: true,
          orderId: request.orderId,
          paymentUrl: paymentUrl
        });
      }, 1500); // Simulate network latency
    });
  }
}
