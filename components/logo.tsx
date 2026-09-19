export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-lg font-black text-accent-foreground">
        B
      </span>
      <span className="text-xl font-black tracking-tight text-foreground">
        Box<span className="text-accent">Track</span>
      </span>
    </div>
  );
}
