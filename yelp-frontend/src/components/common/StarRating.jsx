import { useState } from 'react'

const sizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' }

export default function StarRating({ value = 0, onChange, size = 'md', readonly = false }) {
  const [hover, setHover] = useState(0)
  const display = hover || value

  return (
    <div className={`flex items-center gap-0.5 ${sizes[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`leading-none transition-transform duration-100 ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}`}
        >
          <span className={display >= star ? 'star-filled' : 'star-empty'}>★</span>
        </button>
      ))}
    </div>
  )
}
