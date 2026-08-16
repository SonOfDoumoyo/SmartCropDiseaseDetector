export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-icon">🌿</span>
          <div>
            <h1 className="logo-title">CropGuard</h1>
            <p className="logo-sub">Smart Crop Disease Identification</p>
          </div>
        </div>
        <p className="header-tagline">
          Upload a leaf photo — get instant diagnosis &amp; treatment advice
        </p>
      </div>
    </header>
  );
}