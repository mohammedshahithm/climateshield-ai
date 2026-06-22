"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "./supabase/client";

export interface Shelter {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  occupied: number;
  status: "Available" | "Full" | "Maintenance";
  created_at: string;
}

export type ResourceType = "Ambulance" | "Rescue Team" | "Water Tanker" | "Fire Unit" | "Medical Team" | "Food Supply Unit";
export type ResourceStatus = "Available" | "En Route" | "Deployed" | "Maintenance";

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  location: string;
  latitude: number;
  longitude: number;
  status: ResourceStatus;
  created_at: string;
}

interface ResourceShelterContextProps {
  shelters: Shelter[];
  resources: Resource[];
  loading: boolean;
  error: string | null;
  addShelter: (shelter: Omit<Shelter, "id" | "created_at">) => Promise<void>;
  updateShelter: (shelter: Shelter) => Promise<void>;
  deleteShelter: (id: string) => Promise<void>;
  addResource: (resource: Omit<Resource, "id" | "created_at">) => Promise<void>;
  updateResource: (resource: Resource) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
}

const ResourceShelterContext = createContext<ResourceShelterContextProps | undefined>(undefined);

export function ResourceShelterProvider({ children }: { children: ReactNode }) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sheltersRes, resourcesRes] = await Promise.all([
          supabase.from("shelters").select("*").order("created_at", { ascending: false }),
          supabase.from("resources").select("*").order("created_at", { ascending: false })
        ]);

        if (sheltersRes.error) throw sheltersRes.error;
        if (resourcesRes.error) throw resourcesRes.error;

        setShelters(sheltersRes.data || []);
        setResources(resourcesRes.data || []);
      } catch (err: any) {
        console.error("Error loading resources/shelters data:", err);
        setError("Failed to sync metrics from database.");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Subscribe to realtime shelters changes
    const sheltersChannel = supabase
      .channel("shelters-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shelters" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setShelters(prev => {
              if (prev.some(s => s.id === payload.new.id)) return prev;
              return [payload.new as Shelter, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setShelters(prev => prev.map(s => (s.id === payload.new.id ? (payload.new as Shelter) : s)));
          } else if (payload.eventType === "DELETE") {
            if (payload.old && payload.old.id) {
              setShelters(prev => prev.filter(s => s.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    // Subscribe to realtime resources changes
    const resourcesChannel = supabase
      .channel("resources-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setResources(prev => {
              if (prev.some(r => r.id === payload.new.id)) return prev;
              return [payload.new as Resource, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setResources(prev => prev.map(r => (r.id === payload.new.id ? (payload.new as Resource) : r)));
          } else if (payload.eventType === "DELETE") {
            if (payload.old && payload.old.id) {
              setResources(prev => prev.filter(r => r.id !== payload.old.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sheltersChannel);
      supabase.removeChannel(resourcesChannel);
    };
  }, [supabase]);

  // Shelters CRUD
  const addShelter = async (newShelter: Omit<Shelter, "id" | "created_at">) => {
    const { error: insertError } = await supabase.from("shelters").insert(newShelter);
    if (insertError) {
      console.error("Error inserting shelter:", insertError);
      throw insertError;
    }
  };

  const updateShelter = async (updatedShelter: Shelter) => {
    const { error: updateError } = await supabase
      .from("shelters")
      .update({
        name: updatedShelter.name,
        address: updatedShelter.address,
        latitude: updatedShelter.latitude,
        longitude: updatedShelter.longitude,
        capacity: updatedShelter.capacity,
        occupied: updatedShelter.occupied,
        status: updatedShelter.status
      })
      .eq("id", updatedShelter.id);

    if (updateError) {
      console.error("Error updating shelter:", updateError);
      throw updateError;
    }
  };

  const deleteShelter = async (id: string) => {
    const { error: deleteError } = await supabase.from("shelters").delete().eq("id", id);
    if (deleteError) {
      console.error("Error deleting shelter:", deleteError);
      throw deleteError;
    }
  };

  // Resources CRUD
  const addResource = async (newResource: Omit<Resource, "id" | "created_at">) => {
    const { error: insertError } = await supabase.from("resources").insert(newResource);
    if (insertError) {
      console.error("Error inserting resource:", insertError);
      throw insertError;
    }
  };

  const updateResource = async (updatedResource: Resource) => {
    const { error: updateError } = await supabase
      .from("resources")
      .update({
        name: updatedResource.name,
        type: updatedResource.type,
        location: updatedResource.location,
        latitude: updatedResource.latitude,
        longitude: updatedResource.longitude,
        status: updatedResource.status
      })
      .eq("id", updatedResource.id);

    if (updateError) {
      console.error("Error updating resource:", updateError);
      throw updateError;
    }
  };

  const deleteResource = async (id: string) => {
    const { error: deleteError } = await supabase.from("resources").delete().eq("id", id);
    if (deleteError) {
      console.error("Error deleting resource:", deleteError);
      throw deleteError;
    }
  };

  return (
    <ResourceShelterContext.Provider
      value={{
        shelters,
        resources,
        loading,
        error,
        addShelter,
        updateShelter,
        deleteShelter,
        addResource,
        updateResource,
        deleteResource
      }}
    >
      {children}
    </ResourceShelterContext.Provider>
  );
}

export function useResourceShelters() {
  const context = useContext(ResourceShelterContext);
  if (!context) {
    throw new Error("useResourceShelters must be used within a ResourceShelterProvider");
  }
  return context;
}
