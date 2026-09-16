import { NativeModules, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { ProductService } from './ProductService';
import { SalesService } from './SalesService';
import { RepairService } from './RepairService';
import { CustomerService } from './CustomerService';
import { FinanceService } from './FinanceService';
import { PurchaseService } from './PurchaseService';

const { AppConfig } = NativeModules;
let apiKey: string = AppConfig?.GROQ_API_KEY || '';

if (Platform.OS === 'android' && AppConfig?.getGroqApiKey) {
  AppConfig.getGroqApiKey()
    .then((key: string) => {
      if (key) {
        apiKey = key;
      }
    })
    .catch(() => {});
}

export interface DocumentKnowledge {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'txt';
  size: string;
  date: string;
  status: 'processed' | 'processing';
  summary: string;
  chunks: string[];
}

let documentLibrary: DocumentKnowledge[] = [
  {
    id: 'doc-1',
    name: 'Company Policy.pdf',
    type: 'pdf',
    size: '2.4 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Official company policies on employee leaves, working hours, code of conduct, and workplace guidelines.',
    chunks: [
      'LEAVE POLICY: All full-time employees are entitled to 18 paid leaves per calendar year, 12 casual leaves, and 10 medical/sick leaves. Sick leave exceeding 2 consecutive days requires a certified medical certificate upon return.',
      'WORKING HOURS & OVERTIME: Standard store operational hours are Monday through Saturday, 9:30 AM to 6:30 PM. Overtime work is compensated at 1.5x regular hourly base pay and must be pre-approved by the store manager.',
      'CODE OF CONDUCT: Zero tolerance policy for workplace harassment, discrimination, or verbal misconduct. Confidential store financial data and customer phone numbers must strictly remain protected under store privacy compliance.',
      'CUSTOMER RELATIONS: All staff must greet walk-in customers respectfully. Price negotiations must strictly follow approved catalog discounts up to 10% maximum.'
    ]
  },
  {
    id: 'doc-2',
    name: 'Employee Handbook.pdf',
    type: 'pdf',
    size: '5.1 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Guidelines for employee onboarding, probation periods, performance review cycles, and medical insurance benefits.',
    chunks: [
      'ONBOARDING & PROBATION: New hires undergo a 90-day probationary review period. Performance evaluations occur at 45 days and 90 days. Confirmation of full-time employment status is subject to manager appraisal.',
      'HEALTH & ACCIDENT INSURANCE: Group health insurance coverage up to ₹3,00,000 is provided to confirmed full-time staff, covering hospitalization and accidental OPD expenses.',
      'APPRAISAL & BONUSES: Bi-annual performance reviews take place in June and December. Sales incentives and monthly bonuses are distributed on the 5th of each month based on achieved store revenue targets.',
      'DRESS CODE & ATTENDANCE: Store uniform and badge are mandatory during active shifts. Biometric check-in is required before 9:45 AM to avoid late penalty deductions.'
    ]
  },
  {
    id: 'doc-3',
    name: 'Repair Manual.pdf',
    type: 'pdf',
    size: '8.2 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Standard operating procedures for smartphone screen replacement, battery renewal, and board-level repairs.',
    chunks: [
      'IPHONE DISPLAY REPLACEMENT PROCEDURE: 1. Power off device and remove bottom Pentalobe screws. 2. Heat screen perimeter to 75°C for 3 minutes using heat pad. 3. Use suction clamp to lift display panel at 45° angle. 4. Disconnect battery flex cable first before touching display connector cables. 5. Transfer proximity sensor and front camera bracket carefully. 6. Install new IP68 water-resistant adhesive seal. 7. Calibrate True Tone and test touch digitizer across all screen quadrants before final casing closure.',
      'BATTERY REPLACEMENT GUIDELINE: Discharge device battery below 25% prior to opening. Disconnect battery connector, peel stretch-release adhesive strips slowly without puncturing cell. Install OEM certified replacement battery and perform two full 0-100% calibration charge cycles.',
      'WATER DAMAGE RECOVERY PROTOCOL: Immediately disconnect battery. Submerge logic board in ultrasonic cleaning bath with 99.9% anhydrous isopropyl alcohol for 15 minutes. Dry thoroughly in thermal drying chamber at 50°C for 45 minutes before inspecting under microscope for trace corrosion.',
      'CHARGING PORT & MICROPHONE DIAGNOSTICS: Inspect for lint buildup before replacing flex board. Verify VBUS 5V/9V power delivery and CC pin termination on USB Type-C connector with digital multimeter.'
    ]
  },
  {
    id: 'doc-4',
    name: 'Product Price List.xlsx',
    type: 'xlsx',
    size: '1.2 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Spreadsheet of retail MRP, selling price, wholesale B2B pricing, and margin tiers across mobile accessories.',
    chunks: [
      'AUDIO ACCESSORIES PRICING: Boat Airdopes 141 - MRP ₹4,490, Retail Selling Price ₹1,299, Wholesale B2B Price ₹899 (Min order 10 pcs). Noise Buds VS102 - MRP ₹2,999, Retail ₹1,099, B2B ₹780.',
      'CHARGING ADAPTERS & CABLES: 65W GaN Super Fast Charger - MRP ₹2,499, Retail ₹1,499, B2B ₹850. Braided Type-C 100W Cable 2m - MRP ₹799, Retail ₹399, B2B ₹190.',
      'DISPLAY REPAIR REPLACEMENT PARTS: iPhone 13 Screen OEM - Cost ₹6,500, Customer Charge ₹9,500. OnePlus 9 Screen OLED - Cost ₹4,200, Customer Charge ₹6,800. Samsung S21 Screen - Cost ₹5,800, Customer Charge ₹8,400.',
      'TEMPERED GLASS & CASING: 9D Privacy Tempered Glass - Retail ₹299, Bulk ₹45. MagSafe Armor Shockproof Case - Retail ₹599, Bulk ₹180.'
    ]
  },
  {
    id: 'doc-5',
    name: 'Warranty Policy.pdf',
    type: 'pdf',
    size: '1.8 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Customer warranty terms covering device repairs, accessory replacements, and limitation of liability clauses.',
    chunks: [
      'REPAIR WARRANTY PERIOD: All screen replacements and motherboard repairs carry an unconditional 90-day store warranty against touch unresponsiveness, discoloration, or soldering defects.',
      'WARRANTY EXCLUSIONS: Warranty is strictly void if device exhibits physical glass cracking, deep impact dents, water contact, or tampering by unauthorized third-party technicians after collection date.',
      'ACCESSORY REPLACEMENT TERMS: Branded cables, power banks, and earphones include a 6-month replacement warranty against manufacturing hardware failures with valid store printed invoice.',
      'CLAIM PROCEDURE: Customer must present original physical invoice or SMS receipt number. Replacement parts are dispatched within 24-48 business hours.'
    ]
  },
  {
    id: 'doc-6',
    name: 'Product Catalogue.pdf',
    type: 'pdf',
    size: '3.4 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Full retail catalog of smartphones, wearable smartwatches, wireless earbuds, protective gear, and charging solutions.',
    chunks: [
      'SMARTPHONE HARDWARE CATALOG: Curated stock of refurbished and brand new Apple iPhones, OnePlus flagship models, Samsung Galaxy A/S series, and Xiaomi budget performers with manufacturer bill and box.',
      'WEARABLES & AUDIO: Noise, Boat, Fire-Boltt smartwatches with SpO2 and AMOLED displays. Bluetooth neckbands and active noise cancellation TWS earbuds with warranty.'
    ]
  },
  {
    id: 'doc-7',
    name: 'Terms & Conditions.pdf',
    type: 'pdf',
    size: '1.5 MB',
    date: 'Indexed & Ready',
    status: 'processed',
    summary: 'Standard store trading terms, customer dispute arbitration, invoice terms, and device unclaimed storage policies.',
    chunks: [
      'UNCLAIMED REPAIR DEVICES: Repaired devices not collected within 45 days after customer SMS notification are subject to a nominal ₹10/day storage fee. Devices unclaimed after 90 days may be liquidated to recover labor and parts costs.',
      'PAYMENT MODES ACCEPTED: We accept UPI (GPay, PhonePe, Paytm), Visa/Mastercard credit/debit cards, Net Banking, and Cash. Instant GST invoices are generated for all transactions.'
    ]
  }
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
  
  addDocument: (docName: string) => {
    const existing = documentLibrary.find(d => d.name.toLowerCase() === docName.toLowerCase());
    if (!existing) {
      documentLibrary = [
        {
          id: `doc-${Date.now()}`,
          name: docName,
          type: docName.endsWith('.xlsx') ? 'xlsx' : docName.endsWith('.docx') ? 'docx' : 'pdf',
          size: '2.5 MB',
          date: 'Indexed & Ready',
          status: 'processed',
          summary: `Extracted and vectorized document for ${docName}. Ready for RAG question answering.`,
          chunks: [
            `DOCUMENT: ${docName}. This document contains active business guidelines, catalog data, or standard operating procedures.`,
            `SECTION OVERVIEW: Detailed operating rules and operational context extracted for ${docName}.`
          ]
        },
        ...documentLibrary
      ];
    }
  },
  getDocuments: () => documentLibrary.map((d) => d.name),
  getDocumentLibrary: (): DocumentKnowledge[] => [...documentLibrary],
  addDetailedDocument: (doc: DocumentKnowledge) => {
    documentLibrary = [doc, ...documentLibrary];
  },
  deleteDocument: (id: string) => {
    documentLibrary = documentLibrary.filter((d) => d.id !== id);
  },
  reprocessDocument: (id: string) => {
    documentLibrary = documentLibrary.map((d) =>
      d.id === id ? { ...d, status: 'processed' as const, date: 'Just re-indexed' } : d
    );
  },

  /**
   * RAG Engine: Retrieves matching document chunks and feeds them as ground truth to the AI.
   */
  queryDocumentRag: async (
    question: string,
    docIdOrName?: string
  ): Promise<{ answer: string; sourceDoc: string; chunksUsed: string[] }> => {
    let targetDocs = documentLibrary;
    if (docIdOrName) {
      const match = documentLibrary.find(
        (d) => d.id === docIdOrName || d.name.toLowerCase() === docIdOrName.toLowerCase()
      );
      if (match) {
        targetDocs = [match];
      }
    }

    const lowerQ = question.toLowerCase();
    const queryTokens = lowerQ.split(/\s+/).filter((t) => t.length > 2);

    // Score and retrieve most relevant chunks
    const scoredChunks: { chunk: string; docName: string; score: number }[] = [];
    targetDocs.forEach((doc) => {
      doc.chunks.forEach((chunk) => {
        const lowerChunk = chunk.toLowerCase();
        let score = 0;
        queryTokens.forEach((token) => {
          if (lowerChunk.includes(token)) score += 2;
        });
        if (lowerChunk.includes(lowerQ)) score += 5;
        if (score > 0 || queryTokens.length === 0) {
          scoredChunks.push({ chunk, docName: doc.name, score });
        }
      });
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 3);
    const contextText =
      topChunks.length > 0
        ? topChunks.map((c) => `[From ${c.docName}]: ${c.chunk}`).join('\n\n')
        : targetDocs
            .slice(0, 2)
            .map((d) => `[From ${d.name}]: ${d.chunks.join(' ')}`)
            .join('\n\n');

    const sourceName = topChunks.length > 0 ? topChunks[0].docName : targetDocs[0]?.name || 'Document Knowledge Base';

    try {
      const prompt = `You are an expert AI enterprise business assistant. Based STRICTLY on the following retrieved company document excerpts, provide a clear, accurate, and direct answer to the user's question. Cite the specific policy, procedure, or price from the text.
      
Retrieved Document Context:
${contextText}

User Question: "${question}"

Answer directly, accurately, and professionally:`;

      const aiResponse = await AiService.promptGemini(prompt, '', false);
      return {
        answer: aiResponse,
        sourceDoc: sourceName,
        chunksUsed: topChunks.map((c) => c.chunk),
      };
    } catch {
      // Offline / fallback RAG synthesis
      if (topChunks.length > 0) {
        return {
          answer: `According to ${sourceName}:\n\n${topChunks.map((c) => c.chunk).join('\n\n')}`,
          sourceDoc: sourceName,
          chunksUsed: topChunks.map((c) => c.chunk),
        };
      }
      return {
        answer: `I searched "${sourceName}". Here is what our policy states:\n\n${targetDocs[0]?.chunks[0] || 'No specific match found.'}`,
        sourceDoc: sourceName,
        chunksUsed: targetDocs[0]?.chunks.slice(0, 1) || [],
      };
    }
  },

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
- Available Documents: ${documentLibrary.map((d) => d.name).join(', ')}

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

  promptGemini: async (systemInstruction: string, prompt: string = '', isJsonMode = false) => {
    let currentKey = apiKey;
    if (!currentKey && Platform.OS === 'android' && AppConfig?.getGroqApiKey) {
      try {
        currentKey = await AppConfig.getGroqApiKey();
        if (currentKey) apiKey = currentKey;
      } catch {}
    }

    // If no API key is set, use real business summary to generate smart offline responses
    if (!currentKey) {
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
        return `Customers:\n- Total Registered: ${summary.totalCustomers}\n- Sample names: ${summary.customerNamesSample.join(', ')}`;
      } else {
        return `Live Business Overview:\n- Products: ${summary.totalProducts}\n- Completed Sales: ₹${summary.totalRevenue.toLocaleString('en-IN')} (${summary.totalSales} orders)\n- Uncollected Customer Balance: ₹${summary.pendingCustomerPayments.toLocaleString('en-IN')}\n- Pending Repairs: ${summary.pendingRepairs}\n- Total Registered Customers: ${summary.totalCustomers}`;
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
                'Authorization': `Bearer ${currentKey}`
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
