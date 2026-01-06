"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Mail,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tailfire/ui-public";

// Mock travelers data
const travelers = [
  {
    id: "trav-1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "January 15, 1985",
    passportNumber: "***456789",
    passportExpiry: "March 2028",
    relationship: "Primary",
    nationality: "United States",
  },
  {
    id: "trav-2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    phone: "+1 (555) 234-5678",
    dateOfBirth: "April 22, 1987",
    passportNumber: "***234567",
    passportExpiry: "July 2027",
    relationship: "Spouse",
    nationality: "United States",
  },
  {
    id: "trav-3",
    name: "Alex Doe",
    email: "alex.doe@example.com",
    phone: "+1 (555) 345-6789",
    dateOfBirth: "September 10, 2010",
    passportNumber: "***345678",
    passportExpiry: "December 2026",
    relationship: "Child",
    nationality: "United States",
  },
];

export default function TravelersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTravelers = travelers.filter(
    (traveler) =>
      traveler.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      traveler.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case "Primary":
        return "bg-phoenix-gold";
      case "Spouse":
        return "bg-blue-600";
      case "Child":
        return "bg-green-600";
      default:
        return "bg-gray-600";
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
            <h1 className="text-2xl font-bold text-white">Travelers</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">
            Manage traveler profiles for your trips
          </p>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-phoenix-text-muted" />
            <Input
              type="search"
              placeholder="Search travelers..."
              className="pl-9 bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white w-full sm:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="btn-phoenix-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Traveler
          </Button>
        </div>
      </div>

      {/* Travelers Grid */}
      {filteredTravelers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTravelers.map((traveler) => (
            <Card
              key={traveler.id}
              className="bg-phoenix-charcoal/50 border-phoenix-gold/30 hover:border-phoenix-gold/50 transition-all"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-2 border-phoenix-gold/50">
                      <AvatarFallback className="bg-phoenix-gold/20 text-phoenix-gold text-lg">
                        {getInitials(traveler.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {traveler.name}
                      </h3>
                      <Badge
                        className={`${getRelationshipColor(traveler.relationship)} text-white border-0 mt-1`}
                      >
                        {traveler.relationship}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-phoenix-text-muted hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-phoenix-charcoal border-phoenix-gold/30">
                      <DropdownMenuItem className="text-phoenix-text-light hover:bg-phoenix-gold/10 cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-phoenix-text-light hover:bg-phoenix-gold/10 cursor-pointer">
                        <User className="h-4 w-4 mr-2" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-phoenix-gold/30" />
                      <DropdownMenuItem className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-phoenix-gold" />
                    <span className="text-phoenix-text-light">{traveler.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-phoenix-gold" />
                    <span className="text-phoenix-text-light">{traveler.phone}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-phoenix-gold/20">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-phoenix-text-muted">Date of Birth</p>
                      <p className="text-phoenix-text-light">{traveler.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-phoenix-text-muted">Nationality</p>
                      <p className="text-phoenix-text-light">{traveler.nationality}</p>
                    </div>
                    <div>
                      <p className="text-phoenix-text-muted">Passport</p>
                      <p className="text-phoenix-text-light">{traveler.passportNumber}</p>
                    </div>
                    <div>
                      <p className="text-phoenix-text-muted">Expiry</p>
                      <p className="text-phoenix-text-light">{traveler.passportExpiry}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-4 border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-phoenix-text-muted mb-4" />
          <h3 className="text-xl font-medium text-white">No travelers found</h3>
          <p className="text-phoenix-text-muted mt-2 max-w-md mx-auto">
            {searchQuery
              ? `No travelers matching "${searchQuery}"`
              : "Add travelers to your profile for faster booking."}
          </p>
          <Button className="mt-6 btn-phoenix-primary">
            <Plus className="h-4 w-4 mr-2" /> Add Your First Traveler
          </Button>
        </div>
      )}
    </>
  );
}
