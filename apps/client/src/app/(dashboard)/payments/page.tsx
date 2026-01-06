"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  CreditCard,
  Download,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tailfire/ui-public";

const payments = [
  {
    id: "pay-1",
    description: "Mediterranean Cruise - Final Payment",
    amount: 4250.0,
    date: "April 15, 2025",
    status: "Paid",
    method: "Visa ending in 4567",
    trip: "Mediterranean Cruise",
    invoice: "INV-2025-0415",
  },
  {
    id: "pay-2",
    description: "Safari Adventure - Deposit",
    amount: 1500.0,
    date: "March 10, 2025",
    status: "Paid",
    method: "Mastercard ending in 8901",
    trip: "Safari Adventure",
    invoice: "INV-2025-0310",
  },
  {
    id: "pay-3",
    description: "Safari Adventure - Final Payment",
    amount: 3500.0,
    date: "May 10, 2025",
    status: "Pending",
    method: "Not Processed",
    trip: "Safari Adventure",
    invoice: "INV-2025-0510",
  },
];

const paymentMethods = [
  {
    id: "card-1",
    type: "Visa",
    last4: "4567",
    expiry: "05/27",
    name: "John Doe",
    isDefault: true,
  },
  {
    id: "card-2",
    type: "Mastercard",
    last4: "8901",
    expiry: "09/26",
    name: "John Doe",
    isDefault: false,
  },
];

const upcomingPayments = [
  {
    id: "upcoming-1",
    description: "Safari Adventure - Final Payment",
    amount: 3500.0,
    dueDate: "May 10, 2025",
    trip: "Safari Adventure",
    invoice: "INV-2025-0510",
  },
  {
    id: "upcoming-2",
    description: "Northern Lights Expedition - Final Payment",
    amount: 4800.0,
    dueDate: "September 20, 2025",
    trip: "Northern Lights Expedition",
    invoice: "INV-2025-0920",
  },
];

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("history");

  const filteredPayments = payments.filter(
    (payment) =>
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.trip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoice.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="text-phoenix-text-muted hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Payment History</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">
            View and manage your payments and payment methods
          </p>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-phoenix-text-muted" />
            <Input
              type="search"
              placeholder="Search payments..."
              className="pl-9 bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white w-full sm:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
              >
                <Filter className="h-4 w-4 mr-2" /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
              <DropdownMenuLabel>Filter Payments</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-phoenix-gold/30" />
              <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                All Payments
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                Paid
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                Pending
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="btn-phoenix-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Payment Method
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-phoenix-charcoal/50 border border-phoenix-gold/30 p-1 w-full sm:w-auto">
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Payment History
          </TabsTrigger>
          <TabsTrigger
            value="methods"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Payment Methods
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Upcoming Payments
          </TabsTrigger>
        </TabsList>

        {/* Payment History */}
        <TabsContent value="history" className="pt-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Payment History</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                View all your past and pending payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayments.length > 0 ? (
                <div className="rounded-md border border-phoenix-gold/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-phoenix-charcoal/70">
                      <TableRow className="border-phoenix-gold/30 hover:bg-transparent">
                        <TableHead className="text-phoenix-text-light">Description</TableHead>
                        <TableHead className="text-phoenix-text-light text-right">Amount</TableHead>
                        <TableHead className="text-phoenix-text-light hidden md:table-cell">Date</TableHead>
                        <TableHead className="text-phoenix-text-light hidden md:table-cell">Method</TableHead>
                        <TableHead className="text-phoenix-text-light">Status</TableHead>
                        <TableHead className="text-phoenix-text-light text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="border-phoenix-gold/30 hover:bg-phoenix-gold/5">
                          <TableCell className="font-medium text-white">
                            <div>{payment.description}</div>
                            <div className="text-xs text-phoenix-text-muted mt-1">{payment.invoice}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-white">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-phoenix-text-light">
                            {payment.date}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-phoenix-text-light">
                            {payment.method}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${
                                payment.status === "Paid"
                                  ? "bg-green-600"
                                  : "bg-phoenix-orange"
                              } text-white border-0`}
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-phoenix-text-muted hover:text-white"
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-phoenix-gold/30" />
                                <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                                  <Download className="h-4 w-4 mr-2" /> Download Receipt
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                                  View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 mx-auto text-phoenix-text-muted mb-4" />
                  <h3 className="text-xl font-medium text-white">No payments found</h3>
                  <p className="text-phoenix-text-muted mt-2 max-w-md mx-auto">
                    {searchQuery
                      ? `No payments matching "${searchQuery}".`
                      : "You don't have any payment history yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods */}
        <TabsContent value="methods" className="pt-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Payment Methods</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                Manage your saved payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="p-4 rounded-lg border border-phoenix-gold/30 bg-phoenix-charcoal/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-phoenix-gold/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-phoenix-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">
                            {method.type} •••• {method.last4}
                          </h3>
                          {method.isDefault && (
                            <Badge className="bg-phoenix-gold/20 text-phoenix-gold border border-phoenix-gold/30">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-phoenix-text-muted mt-1">
                          <span>Expires {method.expiry}</span>
                          <span>•</span>
                          <span>{method.name}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
                      >
                        Edit
                      </Button>
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-phoenix-text-muted hover:text-white hover:bg-phoenix-charcoal/70"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button className="w-full btn-phoenix-primary">
                  <Plus className="h-4 w-4 mr-2" /> Add New Payment Method
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Payments */}
        <TabsContent value="upcoming" className="pt-6">
          <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
            <CardHeader>
              <CardTitle className="text-white">Upcoming Payments</CardTitle>
              <CardDescription className="text-phoenix-text-muted">
                View and manage your scheduled payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingPayments.length > 0 ? (
                <div className="rounded-md border border-phoenix-gold/30 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-phoenix-charcoal/70">
                      <TableRow className="border-phoenix-gold/30 hover:bg-transparent">
                        <TableHead className="text-phoenix-text-light">Description</TableHead>
                        <TableHead className="text-phoenix-text-light text-right">Amount</TableHead>
                        <TableHead className="text-phoenix-text-light">Due Date</TableHead>
                        <TableHead className="text-phoenix-text-light hidden md:table-cell">Trip</TableHead>
                        <TableHead className="text-phoenix-text-light text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingPayments.map((payment, index) => (
                        <TableRow
                          key={payment.id}
                          className="border-phoenix-gold/30 hover:bg-phoenix-gold/5"
                        >
                          <TableCell className="font-medium text-white">
                            <div>{payment.description}</div>
                            <div className="text-xs text-phoenix-text-muted mt-1">{payment.invoice}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-white">
                            ${payment.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-phoenix-text-light">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-phoenix-gold" />
                              {payment.dueDate}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-phoenix-text-light">
                            {payment.trip}
                          </TableCell>
                          <TableCell className="text-right">
                            {index === 0 ? (
                              <Button className="btn-phoenix-primary">Pay Now</Button>
                            ) : (
                              <Button
                                variant="outline"
                                className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
                              >
                                Schedule
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 mx-auto text-phoenix-text-muted mb-4" />
                  <h3 className="text-xl font-medium text-white">No upcoming payments</h3>
                  <p className="text-phoenix-text-muted mt-2 max-w-md mx-auto">
                    You don&apos;t have any scheduled payments at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
