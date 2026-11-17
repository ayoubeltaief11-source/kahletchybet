type P = { name: string; className?: string };
const paths: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5",
  football: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.5 3.6 2.6-1.4 4.3H9.8L8.4 9.1 12 6.5Z",
  basketball: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2v20M5 5c4 3 4 11 0 14M19 5c-4 3-4 11 0 14",
  tennis: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM4.5 4.5c5 2 8 7 8.5 15M19.5 4.5c-5 2-8 7-8.5 15",
  volleyball: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 12 4 7M12 12l8-5M12 12v10",
  baseball: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM6 4c2 4 2 12 0 16M18 4c-2 4-2 12 0 16",
  hockey: "M4 18h11l5-12M4 18l2 3h9M15 6h5",
  mma: "M7 11V6a2 2 0 1 1 4 0v5m0-3a2 2 0 1 1 4 0v3m0-1a2 2 0 1 1 4 0v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6v-5a2 2 0 1 1 4 0",
  esports: "M7 8h10a5 5 0 0 1 5 5v1a4 4 0 0 1-7 2.6L13 15h-2l-2 1.6A4 4 0 0 1 2 14v-1a5 5 0 0 1 5-5ZM8 11v2M7 12h2M16 11.5h.01M18 13.5h.01",
  casino: "M4 5h16v14H4zM8 9h.01M16 15h.01M12 12h.01M8 15h.01M16 9h.01",
  live: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-2 6 6 4-6 4V8Z",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M3 7h16a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
  shield: "M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4ZM9.5 12l1.8 1.8 3.4-3.6",
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  cog: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3a8 8 0 0 0-.2-1.7l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.9-1.7L14.2 2H9.8l-.4 2.7A8 8 0 0 0 6.5 6.4l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .6 0 1.1.2 1.7l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 2.9 1.7l.4 2.7h4.4l.4-2.7a8 8 0 0 0 2.9-1.7l2.3 1 2-3.4-2-1.5c.1-.6.2-1.1.2-1.7Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.3-4.3",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6",
  edit: "M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4",
  check: "m4 12 5 5L20 6",
  x: "M6 6l12 12M18 6 6 18",
  lock: "M6 11h12v10H6zM9 11V7a3 3 0 0 1 6 0v4",
  plug: "M9 2v6M15 2v6M6 8h12v3a6 6 0 0 1-12 0V8ZM12 17v5",
  slots: "M4 5h16v14H4zM9 5v14M15 5v14M6.5 10h.01M12 12h.01M17.5 14h.01",
  crash: "M3 20c5-1 9-6 11-13M14 7l4-4 3 3-4 4M8 20H3v-5",
  roulette: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 2v5M12 17v5M2 12h5M17 12h5",
  blackjack: "M6 3h9l3 4v14H6zM9 8h6M9 12h6M9 16h3",
  table: "M3 8h18v3H3zM5 11v9M19 11v9M8 5h8",
  instant: "M13 2 4 14h6l-1 8 9-12h-6l1-8Z",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM2 12h20M12 2c3 3.5 3 16.5 0 20M12 2c-3 3.5-3 16.5 0 20",
  info: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 11v6M12 7.5h.01",
  logout: "M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11",
  ticket: "M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8ZM12 6v12",
  clock: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v6l4 2",
  refresh: "M20 12a8 8 0 1 1-2.3-5.6M20 3v5h-5",
};
export default function Icon({ name, className }: P) {
  const d = paths[name] ?? paths.info;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  );
}