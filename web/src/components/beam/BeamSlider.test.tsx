import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import BeamSlider from './BeamSlider'
import { userEvent } from '../../test/utils'

const labels = {
    move: 'Move the alien along the beam',
    fire: 'Land on',
    less: 'One step back',
    more: 'One step on',
}

type HarnessProps = {
    readonly max?: number
    readonly step?: number
    readonly onFire?: (value: number) => void
}

/** The real page owns the position, so the suite drives a controlled wrapper. */
function Harness({ max = 20, step = 1, onFire = () => {} }: HarnessProps) {
    const [value, setValue] = useState(0)
    return (
        <BeamSlider
            max={max}
            step={step}
            value={value}
            alien="👾"
            disabled={false}
            labels={labels}
            onChange={setValue}
            onFire={() => onFire(value)}
        />
    )
}

const user = userEvent.setup({ delay: null })
const slider = () => screen.getByRole('slider')
const fireButton = () => screen.getByRole('button', { name: /Land on/ })

describe('BeamSlider', () => {
    it('exposes the beam as a labelled slider with the question’s bounds', () => {
        render(<Harness max={15} step={5} />)
        expect(slider()).toHaveAccessibleName('Move the alien along the beam')
        expect(slider()).toHaveAttribute('min', '0')
        expect(slider()).toHaveAttribute('max', '15')
        expect(slider()).toHaveAttribute('step', '5')
    })

    it('moves the alien one step at a time with the nudge buttons', async () => {
        render(<Harness />)
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        expect(fireButton()).toHaveTextContent('Land on 2')

        await user.click(screen.getByRole('button', { name: 'One step back' }))
        expect(fireButton()).toHaveTextContent('Land on 1')
    })

    it('nudges by the beam’s own step, not by one', async () => {
        render(<Harness max={100} step={5} />)
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        expect(fireButton()).toHaveTextContent('Land on 5')
    })

    it('accepts a position dragged straight onto the beam', () => {
        render(<Harness max={20} />)
        // jsdom has no native range behaviour, so the drag is delivered as the
        // change event a real browser would fire. Arrow keys are covered by the
        // Playwright suite, where a real slider is doing the moving.
        fireEvent.change(slider(), { target: { value: '13' } })
        expect(fireButton()).toHaveTextContent('Land on 13')
    })

    it('slides the alien along the rail as the value grows', async () => {
        const { container } = render(<Harness max={10} />)
        const rail = () => container.querySelector<HTMLElement>('.beam__rail')

        // Position is handed to CSS as a unitless 0–1 fraction of the beam.
        expect(rail()?.style.getPropertyValue('--beam-pos')).toBe('0')
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        expect(rail()?.style.getPropertyValue('--beam-pos')).toBe('0.1')
    })

    it('refuses to step past either end of the beam', async () => {
        render(<Harness max={2} />)
        expect(screen.getByRole('button', { name: 'One step back' })).toHaveAttribute('aria-disabled', 'true')

        await user.click(screen.getByRole('button', { name: 'One step back' }))
        expect(fireButton()).toHaveTextContent('Land on 0')

        await user.click(screen.getByRole('button', { name: 'One step on' }))
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        expect(fireButton()).toHaveTextContent('Land on 2')
        expect(screen.getByRole('button', { name: 'One step on' })).toHaveAttribute('aria-disabled', 'true')
    })

    it('fires at whatever the alien is standing on', async () => {
        const onFire = vi.fn()
        render(<Harness onFire={onFire} />)
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        await user.click(fireButton())
        expect(onFire).toHaveBeenCalledWith(1)
    })

    it('labels the beam with 0, its middle and its end', () => {
        const { container } = render(<Harness max={20} />)
        const ticks = [...container.querySelectorAll('.beam__tick')].map(node => node.textContent)
        expect(ticks).toEqual(['0', '10', '20'])
    })

    it('never repeats a tick when the middle lands on an end', () => {
        const { container } = render(<Harness max={5} step={5} />)
        const ticks = [...container.querySelectorAll('.beam__tick')].map(node => node.textContent)
        expect(ticks).toEqual(['0', '5'])
    })

    it('locks every control while an answer is being shown', async () => {
        const onChange = vi.fn()
        const onFire = vi.fn()
        render(
            <BeamSlider
                max={10}
                step={1}
                value={4}
                alien="👾"
                disabled
                labels={labels}
                onChange={onChange}
                onFire={onFire}
            />,
        )
        for (const control of [slider(), fireButton(), ...screen.getAllByRole('button', { name: /One step/ })]) {
            expect(control).toHaveAttribute('aria-disabled', 'true')
        }

        await user.click(fireButton())
        await user.click(screen.getByRole('button', { name: 'One step on' }))
        fireEvent.change(slider(), { target: { value: '9' } })
        expect(onChange).not.toHaveBeenCalled()
        expect(onFire).not.toHaveBeenCalled()
    })

    /**
     * `aria-disabled` rather than `disabled`, for one reason: `disabled` blurs
     * the control it lands on. The beam is locked the instant an answer is
     * given, so a child answering from the keyboard was thrown off the slider
     * by their own answer and had to walk back to it from the top of the page,
     * ten times a drill.
     */
    it('leaves focus on the beam while the answer is being marked', () => {
        const props = {
            max: 10,
            step: 1,
            value: 4,
            alien: '👾',
            labels,
            onChange: () => {},
            onFire: () => {},
        }
        const { rerender } = render(<BeamSlider {...props} disabled={false} />)
        slider().focus()
        expect(slider()).toHaveFocus()

        rerender(<BeamSlider {...props} disabled />)
        expect(slider()).toHaveFocus()
        expect(document.activeElement).not.toBe(document.body)
    })

    it('keeps the alien at the start when the beam has no length', () => {
        const { container } = render(
            <BeamSlider
                max={0}
                step={1}
                value={0}
                alien="👾"
                disabled={false}
                labels={labels}
                onChange={() => {}}
                onFire={() => {}}
            />,
        )
        expect(container.querySelector<HTMLElement>('.beam__rail')?.style.getPropertyValue('--beam-pos')).toBe('0')
    })
})
