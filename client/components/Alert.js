export default function Alert({title}) {
  return(
    <div className="bg-amber-100 rounded-md border-dashed border border-amber-200 px-6 py-2 justify-center flex mb-4">
      <span className="text-center text-amber-800 text-base">{title}</span>
    </div>
  )
}
