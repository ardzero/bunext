import { useState, useEffect, useRef } from 'react'

export function useLazyLoad() {
    const [isIntersecting, setIntersecting] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const element = ref.current
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIntersecting(true)
                    observer.unobserve(entry.target)
                }
            },
            {
                rootMargin: '200px',
            }
        )

        if (element) {
            observer.observe(element)
        }

        return () => {
            if (element) {
                observer.unobserve(element)
            }
        }
    }, [])

    return [ref, isIntersecting] as const
}
