export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <div className="h-14 bg-st-primary" />
      <div className="mx-auto grid max-w-6xl gap-4 px-4 pt-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="st-skeleton h-36" />
        ))}
      </div>
    </div>
  )
}
