import { useEffect, useState } from "react";

const KEY = "scamshield_elderly_mode";

export function useElderlyMode() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const v = typeof window !== "undefined" && localStorage.getItem(KEY) === "1";
    setEnabled(v);
    if (v) document.documentElement.classList.add("elderly");
  }, []);
  function toggle(next?: boolean) {
    const v = next ?? !enabled;
    setEnabled(v);
    localStorage.setItem(KEY, v ? "1" : "0");
    document.documentElement.classList.toggle("elderly", v);
  }
  return { enabled, toggle };
}

export interface LocalContact { id: string; name: string; relationship: string; phone: string }
const CKEY = "scamshield_emergency_contacts";
export function useLocalEmergencyContacts() {
  const [contacts, setContacts] = useState<LocalContact[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CKEY);
      if (raw) setContacts(JSON.parse(raw));
    } catch {}
  }, []);
  function save(next: LocalContact[]) {
    setContacts(next);
    localStorage.setItem(CKEY, JSON.stringify(next));
  }
  return {
    contacts,
    add: (c: Omit<LocalContact, "id">) => save([...contacts, { ...c, id: crypto.randomUUID() }]),
    update: (id: string, patch: Partial<LocalContact>) => save(contacts.map(c => c.id === id ? { ...c, ...patch } : c)),
    remove: (id: string) => save(contacts.filter(c => c.id !== id)),
  };
}
