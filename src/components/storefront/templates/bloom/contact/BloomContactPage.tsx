"use client";

import React, { useState } from "react";
import { getBloomThemeStyles, getBloomFontsLink } from "../home/BloomStorefront";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Textarea } from "../ui/textarea";
import {
  CheckCircle,
  Clock,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
} from "lucide-react";
import { StoreData } from "@/types/store";
import { toast } from "@/hooks/use-toast";

export default function BloomContactPage({ store, isSubdomain = false }: { store: StoreData; isSubdomain?: boolean }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { branding } = store.appearance;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Message Sent", "Your query has been submitted to the merchant.");

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  // Compile active contact methods
  const contactInfo = [];
  if (branding.email) {
    contactInfo.push({
      icon: Mail,
      title: "Email Us",
      details: [branding.email],
      description: "Send us an email anytime",
    });
  }
  if (branding.phone || branding.whatsapp) {
    contactInfo.push({
      icon: Phone,
      title: "Call / WhatsApp Us",
      details: [branding.whatsapp || branding.phone || ""],
      description: "Get in touch directly",
    });
  }
  if (branding.address) {
    contactInfo.push({
      icon: MapPin,
      title: "Visit Us",
      details: [branding.address],
      description: "Our business address",
    });
  }

  // Always show working hours
  contactInfo.push({
    icon: Clock,
    title: "Working Hours",
    details: ["Monday - Friday: 9am - 6pm", "Saturday: 10am - 4pm"],
    description: "Sunday: Closed",
  });

  const features = [
    {
      icon: Headphones,
      title: "Direct Support",
      description: "Get help directly from store owner",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Friendly",
      description: "Quick chat support",
    },
    {
      icon: Shield,
      title: "Secure Shop",
      description: "Safe multi-tenant catalog browsing",
    },
  ];

  const fontsLink = getBloomFontsLink(store.appearance.typography);

  return (
    <div
      className="bloom-theme min-h-screen flex flex-col justify-between antialiased bg-bloom-background text-bloom-foreground"
      style={getBloomThemeStyles(store.appearance.colors, store.appearance.typography)}
    >
      {fontsLink && (
        <link rel="stylesheet" href={fontsLink} />
      )}
      <Header store={store} isSubdomain={isSubdomain} />

      <main className="flex-grow bg-bloom-background">
        <section className="py-16 lg:py-20 bg-bloom-accent">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-6 bg-bloom-primary text-bloom-primary-foreground border-transparent">
                Get in Touch
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-bloom-foreground mb-6 font-heading">
                We&apos;d love to{" "}
                <span className="text-bloom-primary block lg:inline lg:ml-2">
                  hear from you
                </span>
              </h1>
              <p className="text-lg text-bloom-muted max-w-2xl mx-auto">
                Have a question about our products, or want to make a special request? Send us a message or contact us directly.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <Card className="border-bloom-border bg-bloom-card text-bloom-foreground">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-bloom-foreground font-heading">
                      Send us a message
                    </CardTitle>
                    <p className="text-bloom-muted text-sm mt-1">
                      Fill out the form below and we&apos;ll get back to you as soon as possible.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label
                            htmlFor="name"
                            className="text-sm font-medium text-bloom-foreground"
                          >
                            Your Name
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="bg-bloom-background border-bloom-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="email"
                            className="text-sm font-medium text-bloom-foreground"
                          >
                            Your Email
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="bg-bloom-background border-bloom-border"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="subject"
                          className="text-sm font-medium text-bloom-foreground"
                        >
                          Subject
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="How can we help you?"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="bg-bloom-background border-bloom-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-sm font-medium text-bloom-foreground"
                        >
                          Your Message
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us more about your question or concern..."
                          rows={6}
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          className="bg-bloom-background border-bloom-border resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting || isSubmitted}
                        className="w-full sm:w-auto bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90 text-sm font-semibold h-11"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : isSubmitted ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Message Sent!
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Send Message
                          </div>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <Card className="border-bloom-border bg-bloom-card text-bloom-foreground">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold font-heading">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {contactInfo.map((info, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="p-2.5 bg-bloom-accent rounded-lg">
                          <info.icon className="h-5 w-5 text-bloom-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-bloom-foreground mb-1 text-sm font-heading">
                            {info.title}
                          </h3>
                          {info.details.map((detail, idx) => (
                            <p
                              key={idx}
                              className="text-xs sm:text-sm text-bloom-muted font-mono"
                            >
                              {detail}
                            </p>
                          ))}
                          <p className="text-[11px] text-bloom-muted mt-1 leading-relaxed">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-bloom-border bg-bloom-card text-bloom-foreground">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold font-heading">
                      Support Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {features.map((feature, index) => (
                      <div key={index}>
                        <div className="flex items-start gap-3">
                          <div className="p-1 bg-bloom-accent rounded">
                            <feature.icon className="h-4 w-4 text-bloom-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium text-bloom-foreground text-xs font-heading">
                              {feature.title}
                            </h4>
                            <p className="text-[11px] text-bloom-muted mt-0.5 leading-relaxed">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        {index < features.length - 1 && (
                          <Separator className="mt-4 bg-bloom-border" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer store={store} isSubdomain={isSubdomain} />
    </div>
  );
}
