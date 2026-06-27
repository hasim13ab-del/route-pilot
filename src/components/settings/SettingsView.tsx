export function SettingsView() {
  return (
    <div className="bg-white rounded border divide-y">
      <div className="p-4 flex items-center justify-between"><p className="font-medium">PWA Status</p><span className="text-green-500 text-sm font-bold">Offline Ready</span></div>
      <div className="p-4 flex items-center justify-between"><p className="font-medium">Version</p><span className="text-slate-400 text-sm">0.1.0</span></div>
    </div>
  );
}
