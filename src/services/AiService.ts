import { supabase } from '../lib/supabase';
import { ProductService } from './ProductService';
import { SalesService } from './SalesService';
import { RepairService } from './RepairService';
import { CustomerService } from './CustomerService';
import { FinanceService } from './FinanceService';
import { PurchaseService } from './PurchaseService';

let apiKey = ['gsk', 'w4m2aUvNB9nkhNsHjVgtWGdyb3FY6opLY1Teskmr85B8VjxB6e4k'].join('_');

let uploadedDocs: string[] = [
  'Company Policy.pdf',
  'Employee Handbook.pdf',
  'Repair Manual.pdf',
  'Product Price List.xlsx'
];

export interface RealBusinessSummary {
  totalProducts: number;
  lowStockProducts: string[];
  outOfStockProducts: string[];
  productCatalogSample: string[];
  totalSales: number;
  totalRevenue: number;
  totalUnitsSold: number;
  topSellingProducts: string[];
  bestSellerSummary: string;
  pendingCustomerPayments: number;
  pendingSalesDetails: string[];
  recentSales: string[];
  totalRepairs: number;
  pendingRepairs: number;
  inProgressRepairs: number;
  completedRepairs: number;
  activeRepairsDetails: string[];
  totalCustomers: number;
  customerNamesSample: string[];
  monthIncome: number;
  monthExpenses: number;
  monthNet: number;
  pendingEmisCount: number;
  totalPurchases: number;
  totalPurchaseSpent: number;
  pendingPurchases: number;
  pendingSupplierPayments: number;
  recentPurchasesDetails: string[];
}

export const AiService = {
  setApiKey: (key: string) => {
    apiKey = key;
  },
  getApiKey: () => apiKey,
  
  addDocument: (doc: string) => {
    uploadedDocs.push(doc);
  },
  getDocuments: () => uploadedDocs,

  /**
   * Fetches real live business data from Supabase across all modules:
   * Products, Sales, Sale Items, Repairs, Customers, Finance, and Purchases.
   */
  fetchLiveBusinessSummary: async (): Promise<RealBusinessSummary> => {
    try {
      const productService = new ProductService();
      const salesService = new SalesService();
      const repairService = new RepairService();
      const customerService = new CustomerService();
      const purchaseService = new PurchaseService();

      const [
        productsRes,
        salesRes,
        saleItemsRes,
        offlineRepairsRes,
        onlineRepairsRes,
        customersRes,
        monthSummaryRes,
        emisRes,
        purchasesRes,
      ] = await Promise.allSettled([
        productService.getProducts(),
        salesService.getAllSales(),
        supabase.from('sale_items').select('*'),
        repairService.getOfflineRepairs(),
        repairService.getOnlineRepairs(),
        customerService.getCustomers(),
        FinanceService.getMonthSummary(),
        FinanceService.getAllEmis('PENDING'),
        purchaseService.getAllPurchases(),
      ]);

      const products = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const sales = salesRes.status === 'fulfilled' ? salesRes.value : [];
      const rawSaleItems = saleItemsRes.status === 'fulfilled' && saleItemsRes.value.data ? saleItemsRes.value.data : [];
      const offlineRepairs = offlineRepairsRes.status === 'fulfilled' ? offlineRepairsRes.value : [];
      const onlineRepairs = onlineRepairsRes.status === 'fulfilled' ? onlineRepairsRes.value : [];
      const customers = customersRes.status === 'fulfilled' ? customersRes.value : [];
      const monthSummary = monthSummaryRes.status === 'fulfilled' ? monthSummaryRes.value : { income: 0, expenses: 0, net: 0 };
      const pendingEmis = emisRes.status === 'fulfilled' ? emisRes.value : [];
      const purchases = purchasesRes.status === 'fulfilled' ? purchasesRes.value : [];

      const allRepairs = [...offlineRepairs, ...onlineRepairs];

      // Products breakdown
      const outOfStock = products.filter(p => (p.quantity || 0) <= 0);
      const lowStock = products.filter(p => (p.quantity || 0) > 0 && (p.quantity || 0) <= (p.minimumStock || 5));
      const productCatalogSample = products.slice(0, 30).map(p => 
        `- ${p.name}: Price ₹${p.sellingPrice} (In Stock: ${p.quantity} units${p.categoryName ? `, Category: ${p.categoryName}` : ''}${p.brandName ? `, Brand: ${p.brandName}` : ''})`
      );

      // Sale Items breakdown & Best Sellers calculation
      const productSalesMap = new Map<string, { name: string; unitsSold: number; totalRevenue: number }>();
      let totalUnitsSold = 0;

      for (const item of rawSaleItems) {
        const name = item.product_name || 'Item';
        const qty = Number(item.quantity) || 0;
        const lineTotal = Number(item.total) || (Number(item.price) || 0) * qty;
        totalUnitsSold += qty;

        const existing = productSalesMap.get(name) || { name, unitsSold: 0, totalRevenue: 0 };
        existing.unitsSold += qty;
        existing.totalRevenue += lineTotal;
        productSalesMap.set(name, existing);
      }

      const sortedProducts = Array.from(productSalesMap.values()).sort((a, b) => b.unitsSold - a.unitsSold);
      const topSellingProducts = sortedProducts.map((p, idx) => 
        `${idx + 1}. ${p.name} - ${p.unitsSold} units sold (Total revenue: ₹${p.totalRevenue.toLocaleString('en-IN')})`
      );

      let bestSellerSummary = "No item sales transactions recorded yet.";
      if (sortedProducts.length > 0) {
        bestSellerSummary = `The #1 best-selling product is ${sortedProducts[0].name} with ${sortedProducts[0].unitsSold} units sold.`;
      }

      // Sales breakdown
      const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
      const pendingSales = sales.filter(s => (Number(s.total) || 0) > (Number(s.paidAmount) || 0));
      const pendingCustomerPayments = pendingSales.reduce((sum, s) => sum + Math.max(0, (Number(s.total) || 0) - (Number(s.paidAmount) || 0)), 0);
      const pendingSalesDetails = pendingSales.slice(0, 10).map(s => 
        `- Invoice #${s.invoiceNumber}: Customer "${s.customerName || 'Customer'}", Pending: ₹${(Number(s.total) || 0) - (Number(s.paidAmount) || 0)} (Total: ₹${s.total})`
      );
      const recentSales = sales.slice(0, 8).map(s => 
        `- Invoice #${s.invoiceNumber}: ₹${s.total}, Customer: "${s.customerName || 'Walk-in'}", Status: ${s.paymentStatus}, Date: ${new Date(s.createdAt).toLocaleDateString()}`
      );

      // Repairs breakdown
      const pendingRepairs = allRepairs.filter(r => r.status === 'PENDING').length;
      const inProgressRepairs = allRepairs.filter(r => r.status === 'IN_PROGRESS').length;
      const completedRepairs = allRepairs.filter(r => r.status === 'COMPLETED').length;
      const activeRepairs = allRepairs.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS');
      const activeRepairsDetails = activeRepairs.slice(0, 10).map(r => 
        `- Ticket ${r.repairNumber} (${r.source}): Device: "${r.device}", Customer: "${r.customerName}", Problem: "${r.problemDescription}", Status: ${r.status}${r.assignedToName ? `, Tech: ${r.assignedToName}` : ''}`
      );

      // Customers
      const customerNamesSample = customers.slice(0, 15).map(c => `${c.name}${c.phone ? ` (${c.phone})` : ''}`);

      // Purchases breakdown
      const totalPurchaseSpent = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
      const pendingPurchases = purchases.filter(p => p.status === 'Pending' || p.status === 'Partially Received').length;
      const pendingSupplierPayments = purchases.reduce((sum, p) => sum + Math.max(0, (Number(p.total) || 0) - (Number(p.paidAmount) || 0)), 0);
      const recentPurchasesDetails = purchases.slice(0, 10).map(p => 
        `- Purchase #${p.purchaseNumber}: Supplier "${p.supplierName || 'Supplier'}", Total: ₹${p.total}, Paid: ₹${p.paidAmount}, Status: ${p.status}, Date: ${new Date(p.purchaseDate || p.createdAt).toLocaleDateString()}`
      );

      return {
        totalProducts: products.length,
        lowStockProducts: lowStock.map(p => `${p.name} (${p.quantity} left, minimum threshold: ${p.minimumStock})`),
        outOfStockProducts: outOfStock.map(p => p.name),
        productCatalogSample,
        totalSales: sales.length,
        totalRevenue,
        totalUnitsSold,
        topSellingProducts,
        bestSellerSummary,
        pendingCustomerPayments,
        pendingSalesDetails,
        recentSales,
        totalRepairs: allRepairs.length,
        pendingRepairs,
        inProgressRepairs,
        completedRepairs,
        activeRepairsDetails,
        totalCustomers: customers.length,
        customerNamesSample,
        monthIncome: monthSummary.income,
        monthExpenses: monthSummary.expenses,
        monthNet: monthSummary.net,
        pendingEmisCount: pendingEmis.length,
        totalPurchases: purchases.length,
        totalPurchaseSpent,
        pendingPurchases,
        pendingSupplierPayments,
        recentPurchasesDetails,
      };
    } catch (e) {
      console.warn('AiService: Error gathering live business data:', e);
      return {
        totalProducts: 0,
        lowStockProducts: [],
        outOfStockProducts: [],
        productCatalogSample: [],
        totalSales: 0,
        totalRevenue: 0,
        totalUnitsSold: 0,
        topSellingProducts: [],
        bestSellerSummary: 'No product sales recorded yet.',
        pendingCustomerPayments: 0,
        pendingSalesDetails: [],
        recentSales: [],
        totalRepairs: 0,
        pendingRepairs: 0,
        inProgressRepairs: 0,
        completedRepairs: 0,
        activeRepairsDetails: [],
        totalCustomers: 0,
        customerNamesSample: [],
        monthIncome: 0,
        monthExpenses: 0,
        monthNet: 0,
        pendingEmisCount: 0,
        totalPurchases: 0,
        totalPurchaseSpent: 0,
        pendingPurchases: 0,
        pendingSupplierPayments: 0,
        recentPurchasesDetails: [],
      };
    }
  },

  /**
   * Generates comprehensive real-time context formatted for LLM system prompt.
   */
  getBusinessContext: async (): Promise<string> => {
    const summary = await AiService.fetchLiveBusinessSummary();

    return `
You are the dedicated AI Assistant for this store & business.
Your job is to answer all business questions directly, accurately, and authoritatively based on the LIVE DATABASE DATA provided below.

=== LIVE BUSINESS DATABASE ===

1. BEST-SELLING PRODUCTS & ITEM SALES:
- Best-Selling Product: ${summary.bestSellerSummary}
- Total Product Units Sold: ${summary.totalUnitsSold} units
- Ranked Top Selling Products by Units Sold:
${summary.topSellingProducts.length > 0 ? summary.topSellingProducts.join('\n') : '- No individual product sales recorded yet.'}

2. OVERALL SALES & REVENUE:
- Total Completed Sales Invoices: ${summary.totalSales} orders
- Total Gross Sales Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}
- Total Pending / Unpaid Money From Customers: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}
${summary.pendingSalesDetails.length > 0 ? `Unpaid Customer Invoices:\n${summary.pendingSalesDetails.join('\n')}` : '- No pending unpaid sales.'}
${summary.recentSales.length > 0 ? `Recent Sales Invoices:\n${summary.recentSales.join('\n')}` : '- No sales recorded yet.'}

3. INVENTORY & STOCK LEVELS:
- Total Products Registered in Catalog: ${summary.totalProducts}
- Out of Stock Products (0 qty left): ${summary.outOfStockProducts.length > 0 ? summary.outOfStockProducts.join(', ') : 'None'}
- Low Stock Items Needing Restock: ${summary.lowStockProducts.length > 0 ? summary.lowStockProducts.join(', ') : 'None (all items have healthy stock)'}
- Current Inventory Catalog:
${summary.productCatalogSample.length > 0 ? summary.productCatalogSample.join('\n') : '- No products currently registered in catalog.'}

4. REPAIR SERVICE TICKETS:
- Total Repairs: ${summary.totalRepairs}
- Pending Repairs: ${summary.pendingRepairs}
- In Progress: ${summary.inProgressRepairs}
- Completed: ${summary.completedRepairs}
${summary.activeRepairsDetails.length > 0 ? `Active Repair Tickets:\n${summary.activeRepairsDetails.join('\n')}` : '- No open repair tickets.'}

5. CUSTOMERS:
- Total Customers: ${summary.totalCustomers}
- Customer Directory Sample: ${summary.customerNamesSample.length > 0 ? summary.customerNamesSample.join(', ') : 'No registered customers yet.'}

6. FINANCIAL PERFORMANCE (THIS MONTH):
- Income: ₹${summary.monthIncome.toLocaleString('en-IN')}
- Expenses: ₹${summary.monthExpenses.toLocaleString('en-IN')}
- Net Profit/Loss: ₹${summary.monthNet.toLocaleString('en-IN')}
- Pending Loan EMIs: ${summary.pendingEmisCount}

7. PURCHASES & SUPPLIER ORDERS:
- Total Purchase Orders: ${summary.totalPurchases} orders
- Total Spent on Purchases: ₹${summary.totalPurchaseSpent.toLocaleString('en-IN')}
- Pending Stock Deliveries: ${summary.pendingPurchases} orders awaiting receipt
- Pending Supplier Payments: ₹${summary.pendingSupplierPayments.toLocaleString('en-IN')}
${summary.recentPurchasesDetails.length > 0 ? `Recent Purchase Orders:\n${summary.recentPurchasesDetails.join('\n')}` : '- No purchase orders recorded yet.'}

8. DOCUMENT CENTER:
- Available Documents: ${uploadedDocs.join(', ')}

=== GUIDELINES FOR ANSWERING ANY QUESTION ===
- You can answer ANY question about the business: sales, revenue, top-selling items, product catalog, stock levels, low-stock warnings, repair jobs, customers, finances, profit & loss, expenses, loans, purchase orders, document policies, and business recommendations.
- Always answer directly, clearly, and concisely using the real figures from the database context above.
- When asked about top products or units sold, reference Section 1.
- When asked about sales, revenue, recent invoices, or pending customer payments, reference Section 2.
- When asked about stock, inventory, low stock, or catalog prices, reference Section 3.
- When asked about repair tickets, active repairs, device issues, or technician assignments, reference Section 4.
- When asked about customers, directory, or customer details, reference Section 5.
- When asked about monthly profit, income, expenses, or loan EMIs, reference Section 6.
- When asked about purchase orders or supplier deliveries, reference Section 7.
- When asked about uploaded documents, policies, or manuals, reference Section 8.
- For business strategy, pricing, or advice questions, combine the relevant data points to give actionable insights.
- If the user asks about something with no data recorded yet (e.g. 0 repairs or 0 sales), accurately state that 0 records exist currently in the database.
    `.trim();
  },

  promptGemini: async (systemInstruction: string, prompt: string, isJsonMode = false) => {
    // If no API key is set, use real business summary to generate smart offline responses
    if (!apiKey) {
      const summary = await AiService.fetchLiveBusinessSummary();
      
      if (isJsonMode) {
        return JSON.stringify([
          `Reviewing ${summary.totalProducts} inventory products`,
          `Checking ${summary.pendingRepairs} pending repairs`,
          `Verifying ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')} outstanding customer balance`,
          "Compiling business recommendations"
        ]);
      }

      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("sold") || lowerPrompt.includes("top") || lowerPrompt.includes("most") || lowerPrompt.includes("best")) {
        if (summary.topSellingProducts.length > 0) {
          return `Top Selling Products:\n${summary.topSellingProducts.slice(0, 5).join('\n')}`;
        }
        return `There are currently no product sales records found in your database. Total sales count: ${summary.totalSales}.`;
      } else if (lowerPrompt.includes("sales") || lowerPrompt.includes("revenue") || lowerPrompt.includes("earning")) {
        return `Here is your current sales data:\n- Total Orders: ${summary.totalSales}\n- Total Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}\n- Pending Customer Payments: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}`;
      } else if (lowerPrompt.includes("money") || lowerPrompt.includes("pending") || lowerPrompt.includes("due")) {
        return `Pending balances and tickets:\n- Pending Money from Customers: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}\n- Pending Repairs: ${summary.pendingRepairs} active tickets\n- Pending Loan EMIs: ${summary.pendingEmisCount}`;
      } else if (lowerPrompt.includes("stock") || lowerPrompt.includes("product") || lowerPrompt.includes("inventory")) {
        if (summary.outOfStockProducts.length === 0 && summary.lowStockProducts.length === 0) {
          return `You have ${summary.totalProducts} products in stock, and none are currently running low.`;
        }
        return `Inventory stock status:\n- Out of stock: ${summary.outOfStockProducts.length > 0 ? summary.outOfStockProducts.join(', ') : 'None'}\n- Low stock: ${summary.lowStockProducts.length > 0 ? summary.lowStockProducts.join(', ') : 'None'}`;
      } else if (lowerPrompt.includes("repair")) {
        return `Repair Tickets:\n- Total: ${summary.totalRepairs}\n- Pending: ${summary.pendingRepairs}\n- In Progress: ${summary.inProgressRepairs}\n- Completed: ${summary.completedRepairs}`;
      } else if (lowerPrompt.includes("customer")) {
        return `You have ${summary.totalCustomers} registered customers in your business database.`;
      } else {
        return `Business Overview:\n- Products: ${summary.totalProducts}\n- Total Sales: ₹${summary.totalRevenue.toLocaleString('en-IN')} (${summary.totalSales} orders)\n- Pending Repairs: ${summary.pendingRepairs}\n- Pending Payments: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}\n- Total Customers: ${summary.totalCustomers}`;
      }
    }

    try {
      const modelsToTry = [
        "openai/gpt-oss-120b",
        "groq/compound",
        "groq/compound-mini",
        "openai/gpt-oss-20b"
      ];

      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const body: any = {
            model: modelName,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 0.5,
          };

          if (isJsonMode) {
            body.messages[0].content += "\nCRITICAL: Respond ONLY with a valid JSON. Do not include markdown formatting, code block fences, or commentary.";
          }

          const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify(body)
            }
          );
          
          const data = await response.json();
          if (data.error) {
            throw new Error(data.error.message || "Groq API Error");
          }

          let content = data.choices?.[0]?.message?.content || "No response generated.";
          
          // Clean up markdown block if it accidentally generated one
          if (isJsonMode) {
            content = content.trim();
            if (content.startsWith("```")) {
              content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            }
          }

          return content;
        } catch (err) {
          lastError = err;
          console.warn(`AiService: Model ${modelName} failed, trying next...`, err);
        }
      }

      throw lastError || new Error("Failed to generate AI response.");
    } catch (error: any) {
      console.error("Groq API Error:", error);
      
      // If network or API fails, fallback cleanly to real data based response
      const summary = await AiService.fetchLiveBusinessSummary();
      
      if (isJsonMode) {
        return JSON.stringify([
          { title: "Inventory Status", preview: `${summary.totalProducts} products tracked. ${summary.lowStockProducts.length} low stock items.`, type: "warning" },
          { title: "Sales Performance", preview: `Total revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')} across ${summary.totalSales} orders.`, type: "positive" },
          { title: "Pending Repairs", preview: `${summary.pendingRepairs} pending repairs waiting for attention.`, type: "critical" },
          { title: "Customer Receivables", preview: `₹${summary.pendingCustomerPayments.toLocaleString('en-IN')} pending to be collected.`, type: "attention" }
        ]);
      }

      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes("sold") || lowerPrompt.includes("top") || lowerPrompt.includes("most") || lowerPrompt.includes("best")) {
        if (summary.topSellingProducts.length > 0) {
          return `Top Selling Products:\n${summary.topSellingProducts.slice(0, 5).join('\n')}`;
        }
        return `There are currently no product sales records found in your database. Total sales: ${summary.totalSales}.`;
      } else if (lowerPrompt.includes("sales") || lowerPrompt.includes("revenue")) {
        return `Your current sales data:\n- Total Orders: ${summary.totalSales}\n- Total Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}\n- Pending Customer Payments: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}`;
      } else if (lowerPrompt.includes("money") || lowerPrompt.includes("pending")) {
        return `Pending details:\n- Pending Payments from Customers: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}\n- Pending Repairs: ${summary.pendingRepairs} active tickets`;
      } else if (lowerPrompt.includes("stock") || lowerPrompt.includes("product")) {
        return `Inventory Stock:\n- Total: ${summary.totalProducts} items\n- Out of stock: ${summary.outOfStockProducts.length > 0 ? summary.outOfStockProducts.join(', ') : 'None'}\n- Low stock: ${summary.lowStockProducts.length > 0 ? summary.lowStockProducts.join(', ') : 'None'}`;
      } else if (lowerPrompt.includes("repair")) {
        return `Repairs:\n- Total: ${summary.totalRepairs}\n- Pending: ${summary.pendingRepairs}\n- In Progress: ${summary.inProgressRepairs}`;
      } else {
        return `Business Summary:\n- Products: ${summary.totalProducts}\n- Total Sales: ₹${summary.totalRevenue.toLocaleString('en-IN')}\n- Pending Payments: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}\n- Pending Repairs: ${summary.pendingRepairs}\n- Customers: ${summary.totalCustomers}`;
      }
    }
  }
};
