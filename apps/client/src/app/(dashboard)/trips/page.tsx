"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Filter,
  MapPin,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Input,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@tailfire/ui-public";

// Mock trip data
const trips = [
  {
    id: "trip-1",
    name: "Mediterranean Cruise",
    destination: "Greece & Italy",
    image: "/destinations/santorini.jpg",
    startDate: "June 15, 2025",
    endDate: "June 28, 2025",
    status: "Confirmed",
    progress: 85,
    travelers: 2,
    totalCost: 8500,
    paidAmount: 7225,
  },
  {
    id: "trip-2",
    name: "Safari Adventure",
    destination: "Tanzania",
    image: "/destinations/safari.jpg",
    startDate: "September 5, 2025",
    endDate: "September 15, 2025",
    status: "Pending Payment",
    progress: 45,
    travelers: 4,
    totalCost: 12000,
    paidAmount: 5400,
  },
  {
    id: "trip-3",
    name: "Northern Lights Expedition",
    destination: "Iceland",
    image: "/destinations/iceland.jpg",
    startDate: "December 1, 2025",
    endDate: "December 8, 2025",
    status: "Planning",
    progress: 20,
    travelers: 2,
    totalCost: 6800,
    paidAmount: 1360,
  },
];

const pastTrips = [
  {
    id: "past-1",
    name: "Japanese Cultural Journey",
    destination: "Japan",
    image: "/destinations/japan.jpg",
    startDate: "March 10, 2024",
    endDate: "March 24, 2024",
    status: "Completed",
    progress: 100,
    travelers: 2,
  },
];

export default function TripsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-600";
      case "Pending Payment":
        return "bg-phoenix-orange";
      case "Planning":
        return "bg-blue-600";
      case "Completed":
        return "bg-phoenix-gold";
      default:
        return "bg-gray-600";
    }
  };

  const displayedTrips = activeTab === "upcoming" ? trips : pastTrips;
  const filteredTrips = displayedTrips.filter(
    (trip) =>
      trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-bold text-white">My Trips</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">
            View and manage your travel itineraries
          </p>
        </div>
        <div className="flex gap-2 ml-10 sm:ml-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-phoenix-text-muted" />
            <Input
              type="search"
              placeholder="Search trips..."
              className="pl-9 bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white w-full sm:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
          >
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
          <Button className="btn-phoenix-primary">
            <Plus className="h-4 w-4 mr-2" /> New Trip Request
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-phoenix-charcoal/50 border border-phoenix-gold/30 p-1 w-full sm:w-auto">
          <TabsTrigger
            value="upcoming"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Upcoming ({trips.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="data-[state=active]:bg-phoenix-gold data-[state=active]:text-white text-phoenix-text-light"
          >
            Past Trips ({pastTrips.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="pt-6">
          {filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTrips.map((trip) => (
                <Card
                  key={trip.id}
                  className="bg-phoenix-charcoal/50 border-phoenix-gold/30 overflow-hidden hover:border-phoenix-gold/50 transition-all"
                >
                  <div className="relative h-48">
                    <Image
                      src={trip.image}
                      alt={trip.destination}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getStatusColor(trip.status)} text-white border-0`}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{trip.name}</h3>
                        <div className="flex items-center gap-1 text-phoenix-text-muted text-sm mt-1">
                          <MapPin className="h-4 w-4" />
                          {trip.destination}
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
                          <DropdownMenuItem className="text-phoenix-text-light hover:bg-phoenix-gold/10">
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-phoenix-text-light hover:bg-phoenix-gold/10">
                            Download Itinerary
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-phoenix-text-light hover:bg-phoenix-gold/10">
                            View Documents
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-4 mt-4 text-sm text-phoenix-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {trip.startDate}
                      </span>
                      <span>{trip.travelers} travelers</span>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-phoenix-text-muted mb-1">
                        <span>Trip Progress</span>
                        <span>{trip.progress}%</span>
                      </div>
                      <Progress value={trip.progress} className="h-2" />
                    </div>

                    <div className="mt-4 pt-4 border-t border-phoenix-gold/20">
                      <Button className="w-full btn-phoenix-primary">View Trip Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-phoenix-text-muted mb-4" />
              <h3 className="text-xl font-medium text-white">No trips found</h3>
              <p className="text-phoenix-text-muted mt-2">
                {searchQuery
                  ? `No trips matching "${searchQuery}"`
                  : "You don't have any trips yet. Start planning your next adventure!"}
              </p>
              <Button className="mt-6 btn-phoenix-primary">
                <Plus className="h-4 w-4 mr-2" /> Request a New Trip
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
