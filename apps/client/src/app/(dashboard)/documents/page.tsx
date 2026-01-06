"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Filter, Plus, Search, Upload } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tailfire/ui-public";

const documents = [
  {
    id: "doc-1",
    name: "E-Tickets - Mediterranean Cruise",
    description: "Cruise boarding passes and flight tickets",
    type: "PDF",
    size: "2.4 MB",
    date: "May 1, 2025",
    category: "tickets",
    status: "Active",
  },
  {
    id: "doc-2",
    name: "Travel Insurance Policy",
    description: "Insurance policy details and emergency contacts",
    type: "PDF",
    size: "1.8 MB",
    date: "May 5, 2025",
    category: "insurance",
    status: "Active",
  },
  {
    id: "doc-3",
    name: "Shore Excursions - Mediterranean",
    description: "Details of pre-booked shore excursions",
    type: "PDF",
    size: "3.2 MB",
    date: "May 10, 2025",
    category: "itinerary",
    status: "Active",
  },
  {
    id: "doc-4",
    name: "Travel Checklist - Safari Adventure",
    description: "Recommended items to pack for your safari",
    type: "PDF",
    size: "1.1 MB",
    date: "May 15, 2025",
    category: "other",
    status: "Active",
  },
  {
    id: "doc-5",
    name: "Passport Scan - John Doe",
    description: "Digital copy of passport for emergency purposes",
    type: "JPG",
    size: "3.5 MB",
    date: "January 10, 2025",
    category: "passport",
    status: "Expiring Soon",
  },
  {
    id: "doc-6",
    name: "Passport Scan - Jane Doe",
    description: "Digital copy of passport for emergency purposes",
    type: "JPG",
    size: "3.2 MB",
    date: "January 12, 2025",
    category: "passport",
    status: "Valid",
  },
  {
    id: "doc-7",
    name: "Visa - Tanzania",
    description: "Electronic visa for Tanzania safari",
    type: "PDF",
    size: "1.2 MB",
    date: "April 20, 2025",
    category: "visa",
    status: "Pending",
  },
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeTab === "all" || doc.category === activeTab)
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
      case "Valid":
        return "bg-green-600";
      case "Expiring Soon":
        return "bg-phoenix-orange";
      case "Pending":
        return "bg-blue-600";
      default:
        return "bg-phoenix-gold";
    }
  };

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
            <h1 className="text-2xl font-bold text-white">Travel Documents</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">
            Manage your travel documents and important files
          </p>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-phoenix-text-muted" />
            <Input
              type="search"
              placeholder="Search documents..."
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
              <DropdownMenuLabel>Filter Documents</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-phoenix-gold/30" />
              <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                All Documents
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                Active
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-phoenix-gold/10 cursor-pointer">
                Expiring Soon
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button className="btn-phoenix-primary">
            <Upload className="h-4 w-4 mr-2" /> Upload Document
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-phoenix-charcoal/50 border border-phoenix-gold/30 p-1 w-full sm:w-auto overflow-x-auto">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            All Documents
          </TabsTrigger>
          <TabsTrigger
            value="passport"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Passports
          </TabsTrigger>
          <TabsTrigger
            value="visa"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Visas
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Tickets
          </TabsTrigger>
          <TabsTrigger
            value="insurance"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Insurance
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="pt-6">
          {filteredDocuments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <Card
                  key={doc.id}
                  className="bg-phoenix-charcoal/50 border-phoenix-gold/30 hover:border-phoenix-gold/50 transition-all"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-phoenix-gold/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-6 w-6 text-phoenix-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-white truncate">{doc.name}</h3>
                          <Badge
                            className={`flex-shrink-0 ${getStatusBadgeClass(doc.status)} text-white border-0`}
                          >
                            {doc.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-phoenix-text-muted mt-1 truncate">
                          {doc.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-phoenix-text-muted">
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>Added {doc.date}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-phoenix-text-muted hover:text-white hover:bg-phoenix-charcoal/70"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-phoenix-text-muted mb-4" />
              <h3 className="text-xl font-medium text-white">No documents found</h3>
              <p className="text-phoenix-text-muted mt-2 max-w-md mx-auto">
                {searchQuery
                  ? `No documents matching "${searchQuery}". Try adjusting your search.`
                  : "You don't have any documents in this category."}
              </p>
              <Button className="mt-6 btn-phoenix-primary">
                <Plus className="h-4 w-4 mr-2" /> Upload New Document
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
