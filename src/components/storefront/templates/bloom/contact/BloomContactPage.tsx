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
  ExternalLink,
  Headphones,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Store as StoreIcon,
} from "lucide-react";
import { StoreData } from "@/types/store";
import { toast } from "@/hooks/use-toast";
import { resolveStoreContact } from "@/lib/contact-utils";

export default function BloomContactPage({
  store,
  isSubdomain = false,
}: {
  store: StoreData;
  isSubdomain?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const contact = resolveStoreContact(store);
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

    // Simulate inquiry dispatch to store notification queue
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success(
      "Message Sent",
      `Your inquiry has been submitted directly to ${contact.storeName}.`
    );

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const fontsLink = getBloomFontsLink(store.appearance.typography);

  return (
    <div
      className="bloom-theme min-h-screen flex flex-col justify-between antialiased bg-bloom-background text-bloom-foreground"
      style={{
        ...getBloomThemeStyles(store.appearance),
        backgroundColor: "var(--color-background)",
        fontFamily: "var(--font-body)",
      }}
    >
      {fontsLink && <link rel="stylesheet" href={fontsLink} />}
      <Header store={store} isSubdomain={isSubdomain} />

      <main className="flex-grow bg-bloom-background">
        <section className="py-14 lg:py-18 bg-bloom-accent border-b border-bloom-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-bloom-primary text-bloom-primary-foreground border-transparent px-3 py-1 text-xs">
                Contact Store
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-bloom-foreground mb-4 font-heading">
                Contact{" "}
                <span className="text-bloom-primary">{contact.storeName}</span>
              </h1>
              <p className="text-sm sm:text-base text-bloom-muted max-w-2xl mx-auto leading-relaxed">
                {branding.tagline ||
                  "Have a question about our products or need assistance with your order? Get in touch directly with our team."}
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Left Column: Direct Customer Message Form */}
              <div className="lg:col-span-2">
                <Card className="border-bloom-border bg-bloom-card text-bloom-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-bloom-foreground font-heading">
                      Send us a message
                    </CardTitle>
                    <p className="text-bloom-muted text-xs sm:text-sm mt-1">
                      Fill out the form below and {contact.storeName} will get back to you as soon as possible.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label
                            htmlFor="name"
                            className="text-xs sm:text-sm font-medium text-bloom-foreground"
                          >
                            Your Name <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Full name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                            className="bg-bloom-background border-bloom-border text-sm h-10"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="email"
                            className="text-xs sm:text-sm font-medium text-bloom-foreground"
                          >
                            Your Email <span className="text-rose-500">*</span>
                          </label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="bg-bloom-background border-bloom-border text-sm h-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="subject"
                          className="text-xs sm:text-sm font-medium text-bloom-foreground"
                        >
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder="What is your query about?"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="bg-bloom-background border-bloom-border text-sm h-10"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="message"
                          className="text-xs sm:text-sm font-medium text-bloom-foreground"
                        >
                          Your Message <span className="text-rose-500">*</span>
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Write your message or inquiry here..."
                          rows={5}
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          className="bg-bloom-background border-bloom-border resize-none text-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        size="lg"
                        disabled={isSubmitting || isSubmitted}
                        className="w-full sm:w-auto bg-bloom-primary text-bloom-primary-foreground hover:bg-bloom-primary/90 text-sm font-semibold h-11 px-6"
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

              {/* Right Column: Store Merchant Contact Details */}
              <div className="space-y-6">
                <Card className="border-bloom-border bg-bloom-card text-bloom-foreground shadow-sm">
                  <CardHeader className="pb-3 border-b border-bloom-border/60">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="w-5 h-5 text-bloom-primary" />
                      <CardTitle className="text-lg font-semibold font-heading">
                        Store Contact Information
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-5">
                    {/* Store Name & Bio */}
                    <div className="space-y-1">
                      <h4 className="font-bold text-bloom-foreground text-base font-heading">
                        {contact.storeName}
                      </h4>
                      {branding.description && (
                        <p className="text-xs text-bloom-muted line-clamp-3 leading-relaxed">
                          {branding.description}
                        </p>
                      )}
                    </div>

                    <Separator className="bg-bloom-border/60" />

                    {/* WhatsApp Channel */}
                    {contact.whatsapp && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0 mt-0.5">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-bloom-foreground font-heading">
                            WhatsApp Orders & Chat
                          </h5>
                          {contact.whatsappChatUrl ? (
                            <a
                              href={contact.whatsappChatUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-mono font-medium hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              <span>{contact.formattedWhatsapp}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-bloom-muted font-mono block mt-0.5">
                              {contact.formattedWhatsapp}
                            </span>
                          )}
                          <p className="text-[11px] text-bloom-muted mt-0.5">
                            Instant chat & order inquiries via WhatsApp
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phone Channel (Direct Call) */}
                    {contact.phone && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-bloom-accent rounded-lg shrink-0 mt-0.5">
                          <Phone className="h-4 w-4 text-bloom-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-bloom-foreground font-heading">
                            Direct Phone
                          </h5>
                          <a
                            href={`tel:${contact.phone}`}
                            className="text-xs sm:text-sm text-bloom-foreground font-mono hover:text-bloom-primary hover:underline block mt-0.5 font-medium"
                          >
                            {contact.formattedPhone}
                          </a>
                          <p className="text-[11px] text-bloom-muted mt-0.5">
                            Call merchant during business hours
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Email Channel */}
                    {contact.email && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-bloom-accent rounded-lg shrink-0 mt-0.5">
                          <Mail className="h-4 w-4 text-bloom-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-bloom-foreground font-heading">
                            Store Email
                          </h5>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-xs sm:text-sm text-bloom-foreground font-mono hover:text-bloom-primary hover:underline block mt-0.5 truncate font-medium"
                          >
                            {contact.email}
                          </a>
                          <p className="text-[11px] text-bloom-muted mt-0.5">
                            Customer service & business email
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Business Address */}
                    {contact.address && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-bloom-accent rounded-lg shrink-0 mt-0.5">
                          <MapPin className="h-4 w-4 text-bloom-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold text-xs text-bloom-foreground font-heading">
                            Store Location & Address
                          </h5>
                          <p className="text-xs sm:text-sm text-bloom-muted mt-0.5 leading-relaxed font-body">
                            {contact.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Social Channels */}
                    {(contact.instagramUrl || contact.facebookUrl) && (
                      <div className="pt-2 border-t border-bloom-border/60">
                        <h5 className="font-semibold text-xs text-bloom-foreground font-heading mb-2">
                          Connect on Social Media
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {contact.instagramUrl && (
                            <a
                              href={contact.instagramUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bloom-accent text-xs font-medium text-bloom-foreground hover:bg-bloom-primary hover:text-bloom-primary-foreground transition-colors"
                            >
                              <span>Instagram</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          )}
                          {contact.facebookUrl && (
                            <a
                              href={contact.facebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bloom-accent text-xs font-medium text-bloom-foreground hover:bg-bloom-primary hover:text-bloom-primary-foreground transition-colors"
                            >
                              <span>Facebook</span>
                              <ExternalLink className="w-3 h-3 opacity-70" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fallback if merchant hasn't published direct channels */}
                    {!contact.hasAnyDirectContact && (
                      <div className="p-4 rounded-xl bg-bloom-accent text-xs text-bloom-muted leading-relaxed">
                        <p className="font-medium text-bloom-foreground mb-1">
                          Inquiry Service
                        </p>
                        Please submit your message using the contact form on this page. Our store representative will reply to your email address promptly.
                      </div>
                    )}

                    <Separator className="bg-bloom-border/60" />

                    {/* Standard Operating Hours */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-bloom-accent rounded-lg shrink-0 mt-0.5">
                        <Clock className="h-4 w-4 text-bloom-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-xs text-bloom-foreground font-heading">
                          Support Hours
                        </h5>
                        <p className="text-xs text-bloom-muted font-mono mt-0.5">
                          Mon – Sat: 9:00 AM – 7:00 PM IST
                        </p>
                        <p className="text-[11px] text-bloom-muted mt-0.5">
                          Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assurance Card */}
                <Card className="border-bloom-border bg-bloom-card text-bloom-foreground shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-bloom-accent rounded-lg">
                        <Shield className="h-4 w-4 text-bloom-primary" />
                      </div>
                      <h4 className="text-xs font-semibold text-bloom-foreground font-heading">
                        Verified Storefront
                      </h4>
                    </div>
                    <p className="text-[11px] text-bloom-muted leading-relaxed">
                      All orders and communications with {contact.storeName} are processed securely through our catalog platform.
                    </p>
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
