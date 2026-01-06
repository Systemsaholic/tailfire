import { useStoredState } from "@/lib/mock-store";

export type RequestItem = {
  id: string;
  title: string;
  status: "Submitted" | "Responded" | "Pending";
  details?: string;
  tripId?: string;
  tripTitle?: string;
  consultantId?: string;
  sessionId?: string;
  createdAt: string;
};

const defaultRequests: RequestItem[] = [
  { id: "r1", title: "Maldives Overwater Retreat", status: "Submitted", createdAt: new Date().toISOString() },
  { id: "r2", title: "Custom Italy Family Trip", status: "Responded", createdAt: new Date().toISOString() },
];

export function useRequests() {
  const [requests, setRequests] = useStoredState<RequestItem[]>("mock_requests", defaultRequests);

  const addRequest = (request: Omit<RequestItem, "id" | "createdAt" | "status"> & { status?: RequestItem["status"] }) => {
    const newRequest: RequestItem = {
      id: crypto.randomUUID(),
      status: request.status ?? "Submitted",
      createdAt: new Date().toISOString(),
      ...request,
    };
    setRequests([newRequest, ...requests]);
    return newRequest;
  };

  return { requests, setRequests, addRequest };
}
