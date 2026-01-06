"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bed, Edit, Heart, Plane, Save, AlertCircle } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Textarea,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@tailfire/ui-public";

type TravelPreferences = {
  accommodation: {
    roomType: string;
    bedPreference: string;
    floorPreference: string;
    amenities: string[];
  };
  flight: {
    seatPreference: string;
    classPreference: string;
    mealType: string;
    specialNeeds: string[];
  };
  dining: {
    dietaryRestrictions: string[];
    cuisinePreferences: string[];
    mealTiming: string;
  };
  activity: {
    activityLevel: string;
    interests: string[];
    pace: string;
  };
  special: {
    accessibilityNeeds: string;
    medicalNotes: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
};

const initialPreferences: TravelPreferences = {
  accommodation: {
    roomType: "double",
    bedPreference: "king",
    floorPreference: "high",
    amenities: ["wifi", "pool", "ocean-view"],
  },
  flight: {
    seatPreference: "window",
    classPreference: "business",
    mealType: "regular",
    specialNeeds: ["extra-legroom"],
  },
  dining: {
    dietaryRestrictions: ["gluten-free"],
    cuisinePreferences: ["local", "fine-dining"],
    mealTiming: "regular",
  },
  activity: {
    activityLevel: "moderate",
    interests: ["culture", "food-wine", "nature"],
    pace: "balanced",
  },
  special: {
    accessibilityNeeds: "",
    medicalNotes: "",
    emergencyContact: {
      name: "Jane Doe",
      phone: "+1 (555) 987-6543",
      relationship: "spouse",
    },
  },
};

const accommodationAmenities = [
  { id: "wifi", label: "WiFi" },
  { id: "gym", label: "Gym" },
  { id: "pool", label: "Pool" },
  { id: "spa", label: "Spa" },
  { id: "ocean-view", label: "Ocean View" },
  { id: "balcony", label: "Balcony" },
];

const activityInterests = [
  { id: "culture", label: "Culture & History" },
  { id: "nature", label: "Nature & Wildlife" },
  { id: "beach", label: "Beach & Relaxation" },
  { id: "adventure", label: "Adventure Sports" },
  { id: "food-wine", label: "Food & Wine" },
  { id: "shopping", label: "Shopping" },
];

function CheckboxGroup({
  options,
  selected,
  onChange,
  disabled,
}: {
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled: boolean;
}) {
  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox
            id={option.id}
            checked={selected.includes(option.id)}
            onCheckedChange={() => handleToggle(option.id)}
            disabled={disabled}
            className="border-phoenix-gold/50 data-[state=checked]:bg-phoenix-gold data-[state=checked]:border-phoenix-gold"
          />
          <Label htmlFor={option.id} className="text-sm text-phoenix-text-light cursor-pointer">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

export default function PreferencesPage() {
  const [editMode, setEditMode] = useState(false);
  const [preferences, setPreferences] = useState<TravelPreferences>(initialPreferences);

  const updatePreferences = <K extends keyof TravelPreferences>(
    category: K,
    updates: Partial<TravelPreferences[K]>
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: { ...prev[category], ...updates },
    }));
  };

  const handleSave = () => {
    setEditMode(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">Travel Preferences</h1>
          </div>
          <p className="text-phoenix-text-muted mt-1 ml-10">Customize your travel experience</p>
        </div>
        <div className="ml-10 sm:ml-0">
          {editMode ? (
            <Button className="btn-phoenix-primary" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> Save Preferences
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-phoenix-gold/30 text-phoenix-gold hover:bg-phoenix-gold/10"
              onClick={() => setEditMode(true)}
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Preferences
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Accommodation Preferences */}
        <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bed className="h-5 w-5 text-phoenix-gold" />
              Accommodation Preferences
            </CardTitle>
            <CardDescription className="text-phoenix-text-muted">
              Your preferred room and amenity settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room-type" className="text-phoenix-text-light">Room Type</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.accommodation.roomType}
                  onValueChange={(value) => updatePreferences("accommodation", { roomType: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                    <SelectItem value="suite">Suite</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bed-preference" className="text-phoenix-text-light">Bed Preference</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.accommodation.bedPreference}
                  onValueChange={(value) => updatePreferences("accommodation", { bedPreference: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select bed type" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="king">King</SelectItem>
                    <SelectItem value="queen">Queen</SelectItem>
                    <SelectItem value="twin">Twin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor-preference" className="text-phoenix-text-light">Floor Preference</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.accommodation.floorPreference}
                  onValueChange={(value) => updatePreferences("accommodation", { floorPreference: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select floor" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="low">Low Floor</SelectItem>
                    <SelectItem value="high">High Floor</SelectItem>
                    <SelectItem value="no-preference">No Preference</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-phoenix-text-light">Preferred Amenities</Label>
              <CheckboxGroup
                options={accommodationAmenities}
                selected={preferences.accommodation.amenities}
                onChange={(amenities) => updatePreferences("accommodation", { amenities })}
                disabled={!editMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Flight Preferences */}
        <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plane className="h-5 w-5 text-phoenix-gold" />
              Flight Preferences
            </CardTitle>
            <CardDescription className="text-phoenix-text-muted">
              Your preferred seating and in-flight options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Seat Preference</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.flight.seatPreference}
                  onValueChange={(value) => updatePreferences("flight", { seatPreference: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select seat" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="window">Window</SelectItem>
                    <SelectItem value="aisle">Aisle</SelectItem>
                    <SelectItem value="middle">Middle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Class</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.flight.classPreference}
                  onValueChange={(value) => updatePreferences("flight", { classPreference: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium-economy">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="first">First Class</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Meal Type</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.flight.mealType}
                  onValueChange={(value) => updatePreferences("flight", { mealType: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select meal" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="gluten-free">Gluten-free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Preferences */}
        <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-phoenix-gold" />
              Activity Preferences
            </CardTitle>
            <CardDescription className="text-phoenix-text-muted">
              Your preferred travel style and interests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Activity Level</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.activity.activityLevel}
                  onValueChange={(value) => updatePreferences("activity", { activityLevel: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="relaxed">Relaxed</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-phoenix-text-light">Travel Pace</Label>
                <Select
                  disabled={!editMode}
                  value={preferences.activity.pace}
                  onValueChange={(value) => updatePreferences("activity", { pace: value })}
                >
                  <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                    <SelectValue placeholder="Select pace" />
                  </SelectTrigger>
                  <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                    <SelectItem value="slow">Slow & Relaxed</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="fast">Fast-paced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-phoenix-text-light">Interests</Label>
              <CheckboxGroup
                options={activityInterests}
                selected={preferences.activity.interests}
                onChange={(interests) => updatePreferences("activity", { interests })}
                disabled={!editMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Special Requirements */}
        <Card className="bg-phoenix-charcoal/50 border-phoenix-gold/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-phoenix-gold" />
              Special Requirements
            </CardTitle>
            <CardDescription className="text-phoenix-text-muted">
              Accessibility needs, medical information, and emergency contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-phoenix-text-light">Accessibility Needs</Label>
              <Textarea
                placeholder="Describe any accessibility requirements..."
                value={preferences.special.accessibilityNeeds}
                onChange={(e) => updatePreferences("special", { accessibilityNeeds: e.target.value })}
                disabled={!editMode}
                className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white placeholder:text-phoenix-text-muted min-h-[80px]"
              />
            </div>
            <div className="space-y-4">
              <Label className="text-phoenix-text-light text-base">Emergency Contact</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-phoenix-text-light text-sm">Name</Label>
                  <Input
                    value={preferences.special.emergencyContact.name}
                    onChange={(e) =>
                      updatePreferences("special", {
                        emergencyContact: { ...preferences.special.emergencyContact, name: e.target.value },
                      })
                    }
                    disabled={!editMode}
                    className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-phoenix-text-light text-sm">Phone</Label>
                  <Input
                    type="tel"
                    value={preferences.special.emergencyContact.phone}
                    onChange={(e) =>
                      updatePreferences("special", {
                        emergencyContact: { ...preferences.special.emergencyContact, phone: e.target.value },
                      })
                    }
                    disabled={!editMode}
                    className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-phoenix-text-light text-sm">Relationship</Label>
                  <Select
                    disabled={!editMode}
                    value={preferences.special.emergencyContact.relationship}
                    onValueChange={(value) =>
                      updatePreferences("special", {
                        emergencyContact: { ...preferences.special.emergencyContact, relationship: value },
                      })
                    }
                  >
                    <SelectTrigger className="bg-phoenix-charcoal/50 border-phoenix-gold/30 text-white">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent className="bg-phoenix-charcoal border-phoenix-gold/30 text-white">
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
