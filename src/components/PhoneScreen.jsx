export default function PhoneScreen({ children }) {
  return (
    <div className="app-bg">
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">{children}</div>
      </div>
    </div>
  )
}
