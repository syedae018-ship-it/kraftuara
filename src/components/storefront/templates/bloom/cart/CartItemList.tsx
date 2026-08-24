"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useCart } from "@/context/CartContext";
import { Trash2 } from "lucide-react";
import CartItem from "./CartItem";

export default function CartItemList() {
  const { cart, clearCart } = useCart();

  return (
    <Card className="border-bloom-border bg-bloom-card text-bloom-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold font-heading">Cart Items</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="text-bloom-muted hover:text-red-500 border-0"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {cart.map((item, index) => (
          <CartItem
            key={`${item.id}-${index}`}
            item={item}
            isLast={index === cart.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}
