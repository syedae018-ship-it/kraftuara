"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  ShoppingBag,
  Search,
  Eye,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  X,
  Phone,
  MessageSquare,
  Copy,
  Calendar,
  User,
  MapPin,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { orderRepository } from "@/lib/repositories/order-repository";
import { getOrderDetailsAction, updateOrderStatusAction } from "@/lib/actions/order";
import { PlanGate } from "@/components/dashboard/plan-gate";

export default function MerchantOrdersPage() {
  const { activeStore } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Drawer details states
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchOrders = async () => {
    if (!activeStore?.id) return;
    setIsLoading(true);
    try {
      const data = await orderRepository.getAll(activeStore.id);
      const mapped = data.map((o) => {
        const itemsList = o.items
          ?.map((itm) => `${itm.quantity}x ${itm.productName}`)
          .join(", ") || "No items";
        
        return {
          id: o.orderNumber,
          rawId: o.id,
          customer: o.customerName,
          phone: o.customerPhone,
          address: o.shippingAddress,
          items: itemsList,
          total: `₹${Number(o.totalAmount).toLocaleString()}`,
          rawTotal: o.totalAmount,
          status: o.status, // keep raw lowercase status
          date: new Date(o.createdAt).toLocaleString(),
        };
      });
      setOrders(mapped);
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Error", "Could not retrieve storefront orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStore]);

  // Open slide-over drawer and load complete details
  const handleOpenDrawer = async (row: any) => {
    setSelectedOrder(row);
    setSelectedOrderDetails(null);
    setIsDrawerOpen(true);
    setIsLoadingDetails(true);
    try {
      const response = await getOrderDetailsAction(row.rawId);
      if (response.success && response.order) {
        setSelectedOrderDetails(response.order);
      } else {
        toast.error("Failed to load details", response.error || "Could not retrieve order details.");
      }
    } catch (e) {
      toast.error("Error", "Failed to retrieve order details.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Change status of selected order
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setIsUpdatingStatus(true);
    try {
      const response = await updateOrderStatusAction(selectedOrder.rawId, newStatus as any);
      if (response.success) {
        toast.success("Order Updated", `Order status set to ${newStatus}.`);
        
        // Re-load details
        const detailsRes = await getOrderDetailsAction(selectedOrder.rawId);
        if (detailsRes.success && detailsRes.order) {
          setSelectedOrderDetails(detailsRes.order);
        }
        
        // Refresh orders list
        fetchOrders();
      } else {
        toast.error("Update Failed", response.error || "Failed to update status.");
      }
    } catch (e) {
      toast.error("Error", "An unexpected error occurred.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Copy phone or address utilities
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied", `${label} copied to clipboard.`);
  };

  // Search and Filter Logic
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !searchQuery ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.phone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || o.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    };
  }, [orders]);

  const activeRevenue = useMemo(() => {
    // Only count confirmed, processing, shipped, and delivered orders as active revenue
    return orders
      .filter((o) => ["confirmed", "processing", "shipped", "delivered"].includes(o.status))
      .reduce((sum, o) => sum + (o.rawTotal || 0), 0);
  }, [orders]);

  return (
    <DashboardLayout breadcrumbs={[{ label: "Overview", href: "/dashboard" }, { label: "Orders" }]}>
      <PlanGate
        requiredPlan="growth"
        featureName="Order Management & Status Controls"
        description="Upgrade to the Growth Pack (₹299/mo) or Pro Plan (₹499/mo) to unlock your Order Console, fulfillment lifecycle controls, and customer order management."
      >
        <div className="space-y-6 relative min-h-[calc(100vh-120px)]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white">Orders Console</h1>
              <p className="text-xs text-zinc-400 font-body">Manage and fulfill storefront checkout transactions.</p>
            </div>
          </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#111111] border-white/10 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block font-heading">Total Orders</span>
              <span className="text-xl font-bold text-white font-mono">{counts.all}</span>
            </div>
            <ShoppingBag className="w-5 h-5 text-maroon-400" />
          </Card>
          <Card className="bg-[#111111] border-white/10 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block font-heading">Pending Validation</span>
              <span className="text-xl font-bold text-white font-mono">{counts.pending}</span>
            </div>
            <Clock className="w-5 h-5 text-amber-400" />
          </Card>
          <Card className="bg-[#111111] border-white/10 p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block font-heading">Store Fulfillments Revenue</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">₹{activeRevenue.toLocaleString()}</span>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </Card>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by order number, customer name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-10 pr-4 bg-[#111111] border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-600 outline-none hover:border-white/20 focus:border-maroon-700 transition-all font-body"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 hover:text-white text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center overflow-x-auto gap-1.5 p-1 bg-white/[0.02] border border-white/5 rounded-xl self-start">
            {[
              { id: "all", label: "All", count: counts.all },
              { id: "pending", label: "Pending", count: counts.pending },
              { id: "confirmed", label: "Confirmed", count: counts.confirmed },
              { id: "processing", label: "Processing", count: counts.processing },
              { id: "shipped", label: "Shipped", count: counts.shipped },
              { id: "delivered", label: "Delivered", count: counts.delivered },
              { id: "cancelled", label: "Cancelled", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-semibold font-heading tracking-wide uppercase transition-all whitespace-nowrap flex items-center gap-1.5",
                  statusFilter === tab.id
                    ? "bg-maroon-900/60 border border-maroon-700/50 text-white"
                    : "text-zinc-500 border border-transparent hover:text-zinc-300"
                )}
              >
                {tab.label}
                <span className={cn(
                  "px-1 py-0.5 rounded text-[8px] font-mono",
                  statusFilter === tab.id ? "bg-white/10 text-white" : "bg-white/5 text-zinc-500"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <Card className="bg-[#111111] border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151515]">
            <span className="text-xs font-semibold font-heading text-white">Recent Transactions</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-body text-zinc-300">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="p-4 font-semibold text-zinc-400">Order ID</th>
                  <th className="p-4 font-semibold text-zinc-400">Customer</th>
                  <th className="p-4 font-semibold text-zinc-400">Items Summary</th>
                  <th className="p-4 font-semibold text-zinc-400">Total</th>
                  <th className="p-4 font-semibold text-zinc-400">Status</th>
                  <th className="p-4 font-semibold text-zinc-400">Date</th>
                  <th className="p-4 font-semibold text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-maroon-500" />
                        <span>Loading storefront transactions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-500">
                      No orders match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr key={o.rawId} className="border-b border-white/5 hover:bg-white/[0.01]">
                      <td className="p-4 font-mono font-semibold text-white">{o.id}</td>
                      <td className="p-4 text-white font-semibold">{o.customer}</td>
                      <td className="p-4 max-w-xs truncate text-zinc-400">{o.items}</td>
                      <td className="p-4 font-semibold text-white font-mono">{o.total}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase",
                          o.status === "pending" && "bg-amber-950/80 border border-amber-700/50 text-amber-400",
                          o.status === "confirmed" && "bg-blue-950/80 border border-blue-700/50 text-blue-400",
                          o.status === "processing" && "bg-purple-950/80 border border-purple-700/50 text-purple-400",
                          o.status === "shipped" && "bg-cyan-950/80 border border-cyan-700/50 text-cyan-400",
                          o.status === "delivered" && "bg-emerald-950/80 border border-emerald-700/50 text-emerald-400",
                          o.status === "cancelled" && "bg-rose-950/80 border border-rose-700/50 text-rose-400"
                        )}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-4 text-zinc-500 font-mono">{o.date}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleOpenDrawer(o)}
                            variant="outline"
                            className="px-2 h-7 text-[10px] font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-400" />
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Premium Apple-style Slide-Over Drawer overlay */}
        {isDrawerOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
            {/* Click outside to close */}
            <div className="flex-grow" onClick={() => setIsDrawerOpen(false)} />
            
            {/* Drawer Panel */}
            <div className="w-full max-w-lg bg-[#151515] border-l border-white/10 h-screen overflow-y-auto flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-200">
              
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111111] sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-maroon-400" />
                  <span className="text-sm font-bold font-heading text-white">Order Details: {selectedOrder.id}</span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 flex-grow space-y-6">
                {isLoadingDetails ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-maroon-500" />
                    <span className="text-xs text-zinc-500 font-body">Loading authoritative order snapshots...</span>
                  </div>
                ) : selectedOrderDetails ? (
                  <>
                    {/* Status lifecycle selector */}
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300 font-heading">Fulfillment State</span>
                        {isUpdatingStatus && <Loader2 className="w-4 h-4 animate-spin text-maroon-500" />}
                      </div>
                      <select
                        value={selectedOrderDetails.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdatingStatus}
                        className="w-full h-10 bg-[#111111] border border-white/10 rounded-xl px-3 text-xs text-white font-body outline-none hover:border-white/20 focus:border-maroon-700 cursor-pointer"
                      >
                        <option value="pending">Pending Validation</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Customer Information Card */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold font-heading text-maroon-400 tracking-wider uppercase flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        Customer Information
                      </h3>
                      <Card className="bg-[#111111] border-white/10 p-4 space-y-3.5 rounded-2xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-zinc-500 block uppercase font-heading">Name</span>
                            <span className="text-xs font-semibold text-white font-body">{selectedOrderDetails.customerName}</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-heading">Contact Phone</span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs font-semibold font-mono text-white">{selectedOrderDetails.customerPhone}</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCopyText(selectedOrderDetails.customerPhone, "Phone number")}
                                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
                                title="Copy Phone Number"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`https://wa.me/${selectedOrderDetails.customerPhone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 hover:bg-white/5 rounded-lg text-green-500 hover:text-green-400 transition-all"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-heading">Delivery Address</span>
                          <div className="flex items-start justify-between mt-0.5 gap-2">
                            <span className="text-xs text-zinc-300 font-body leading-relaxed max-w-[85%]">{selectedOrderDetails.shippingAddress}</span>
                            <button
                              onClick={() => handleCopyText(selectedOrderDetails.shippingAddress, "Address")}
                              className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all shrink-0"
                              title="Copy Address"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Ordered Items Table */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold font-heading text-maroon-400 tracking-wider uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Purchase Snapshot
                      </h3>
                      <Card className="bg-[#111111] border-white/10 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11px] font-body text-zinc-300">
                            <thead>
                              <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] text-zinc-400">
                                <th className="p-3 font-semibold">Product Name</th>
                                <th className="p-3 font-semibold text-center">Qty</th>
                                <th className="p-3 font-semibold text-right">Price</th>
                                <th className="p-3 font-semibold text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrderDetails.items?.map((item: any) => (
                                <tr key={item.id} className="border-b border-white/5">
                                  <td className="p-3 text-white font-medium">{item.productName}</td>
                                  <td className="p-3 text-center font-mono text-zinc-400">{item.quantity}</td>
                                  <td className="p-3 text-right font-mono text-zinc-400">₹{Number(item.price).toLocaleString()}</td>
                                  <td className="p-3 text-right font-semibold font-mono text-white">₹{Number(item.lineTotal).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    </div>

                    {/* Financial Summary */}
                    <div className="space-y-1.5 text-xs font-body text-zinc-400">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="font-mono text-white">₹{Number(selectedOrderDetails.totalAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Delivery</span>
                        <span className="text-green-400">Free</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-semibold text-white">
                        <span className="font-heading">Grand Total</span>
                        <span className="font-mono text-maroon-400 text-base">₹{Number(selectedOrderDetails.totalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8 text-zinc-500">Could not retrieve order details.</div>
                )}
              </div>

              {/* Footer metadata */}
              <div className="p-4 border-t border-white/10 bg-[#111111] text-[10px] text-zinc-500 font-mono flex items-center justify-between sticky bottom-0">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                  Placed: {selectedOrderDetails ? new Date(selectedOrderDetails.createdAt).toLocaleString() : ""}
                </span>
                <span>
                  Updated: {selectedOrderDetails ? new Date(selectedOrderDetails.updatedAt).toLocaleTimeString() : ""}
                </span>
              </div>
            </div>
          </div>
        )}
        </div>
      </PlanGate>
    </DashboardLayout>
  );
}
