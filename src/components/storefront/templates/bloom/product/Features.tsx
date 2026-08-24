import { Card, CardContent } from "../ui/card";
import { RotateCcw, Shield, Truck } from "lucide-react";

export default function Features() {
  const features = [
    { icon: Truck, title: "Free Shipping", desc: "On orders over $50" },
    { icon: Shield, title: "Warranty", desc: "1 year guarantee" },
    { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
  ];
  return (
    <Card className="mb-16 border-bloom-border bg-bloom-card text-bloom-foreground">
      <CardContent className="p-8">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="p-3 bg-bloom-accent rounded-lg">
                <feature.icon className="h-6 w-6 text-bloom-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-bloom-foreground mb-1 font-heading">
                  {feature.title}
                </h2>
                <p className="text-sm text-bloom-muted">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
