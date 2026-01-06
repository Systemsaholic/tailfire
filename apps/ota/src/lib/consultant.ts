import { useConsultant } from "@/context/consultant-context";

export type WithConsultant<T extends Record<string, unknown>> = T & { consultantId: string };

export function useConsultantAttribution() {
  const { consultantId, consultant } = useConsultant();

  const withConsultant = <T extends Record<string, unknown>>(payload: T): WithConsultant<T> => ({
    ...payload,
    consultantId,
  });

  return { consultantId, consultant, withConsultant };
}
