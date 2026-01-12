// DateInput - Input de fecha/hora con icono de calendario siempre visible
import * as React from "react"
import { CalendarIcon } from "@heroicons/react/24/outline"
import { Input } from "./input"
import { cn } from "@/lib/utils"

export interface DateInputProps extends React.ComponentProps<"input"> {
  type?: "date" | "datetime-local" | "time"
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, type = "date", ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Combinar refs: el ref pasado por props y nuestro ref interno
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)
    
    const handleIconClick = () => {
      if (inputRef.current) {
        // Enfoque el input
        inputRef.current.focus()
        
        // Intentar abrir el selector de fecha nativo del navegador
        // showPicker() está disponible en navegadores modernos
        if (typeof (inputRef.current as any).showPicker === 'function') {
          try {
            (inputRef.current as any).showPicker()
          } catch (err) {
            // Si showPicker falla (puede ser por políticas de seguridad), 
            // simplemente hacer click en el input
            inputRef.current.click()
          }
        } else {
          // Fallback: hacer click en el input para navegadores antiguos
          inputRef.current.click()
        }
      }
    }
    
    return (
      <div className="relative">
        <Input
          type={type}
          className={cn(
            "pr-10", // Padding derecho para el icono
            className
          )}
          ref={inputRef}
          {...props}
        />
        <button
          type="button"
          onClick={handleIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
          aria-label="Abrir selector de fecha"
          tabIndex={-1}
        >
          <CalendarIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    )
  }
)
DateInput.displayName = "DateInput"

export { DateInput }
