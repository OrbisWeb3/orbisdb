export default function StepsProgress({ steps = [], currentStep = 1 }) {
  return (
    <ol className="relative flex items-center w-full text-sm font-medium text-center mt-4 mb-3 justify-center">
      {steps.map((step, index) => (
        <li
          key={index}
          className={`flex items-center justify-center ${index < steps.length - 1 ? "mr-2" : ""}`}
        >
          <span className="flex justify-end flex-col items-center">
            {currentStep == index + 1 && (
              <span
                className="text-sm text-[#4483FD] absolute"
                style={{ top: -17 }}
              >
                {step}
              </span>
            )}
            <span
              className={`rounded-full h-3 w-3 mt-1 ${currentStep >= index + 1 ? "bg-[#4483FD]" : "bg-slate-200"}`}
            ></span>
          </span>
          {index < steps.length - 1 && (
            <span
              className={`h-1 border-b ml-2 w-16 ${currentStep > index + 1 ? "border-[#4483FD]" : "border-slate-200"}`}
            ></span>
          )}
        </li>
      ))}
    </ol>
  );
}
