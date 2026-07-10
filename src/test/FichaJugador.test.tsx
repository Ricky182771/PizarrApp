import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FichaJugador from '../components/FichaJugador';
import { createRef } from 'react';

describe('FichaJugador', () => {
  it('renders player number and name', () => {
    const constraintsRef = createRef<HTMLDivElement>();
    render(
      <FichaJugador
        numero={11}
        nombre="Messi"
        color="#000000"
        x={50}
        y={50}
        constraintsRef={constraintsRef}
      />
    );

    expect(screen.getByText('11')).toBeInTheDocument();
    expect(screen.getByText('Messi')).toBeInTheDocument();
  });

  it('shows edit modal on click and calls onNameChange on save', () => {
    const constraintsRef = createRef<HTMLDivElement>();
    const onNameChange = vi.fn();
    
    render(
      <FichaJugador
        numero={11}
        nombre="Messi"
        color="#000000"
        x={50}
        y={50}
        constraintsRef={constraintsRef}
        onNameChange={onNameChange}
      />
    );

    const nameSpan = screen.getByText('Messi');
    fireEvent.click(nameSpan);

    const input = screen.getByPlaceholderText('Nombre del jugador') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Messi');

    fireEvent.change(input, { target: { value: 'L. Messi' } });
    
    const saveBtn = screen.getByText('Guardar Cambios');
    fireEvent.click(saveBtn);

    expect(onNameChange).toHaveBeenCalledWith('L. Messi');
  });

  it('stops pointerdown event propagation on name span', () => {
    const constraintsRef = createRef<HTMLDivElement>();
    render(
      <FichaJugador
        numero={11}
        nombre="Messi"
        color="#000000"
        x={50}
        y={50}
        constraintsRef={constraintsRef}
      />
    );

    const nameSpan = screen.getByText('Messi');
    const pointerDownEvent = new MouseEvent('pointerdown', { bubbles: true });
    const stopPropagationSpy = vi.spyOn(pointerDownEvent, 'stopPropagation');

    nameSpan.dispatchEvent(pointerDownEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('renders bottom sheet on click when in mobile mode', () => {
    const constraintsRef = createRef<HTMLDivElement>();
    const onNameChange = vi.fn();
    const onNumberChange = vi.fn();

    render(
      <FichaJugador
        numero={7}
        nombre="Ronaldo"
        color="#ff0000"
        x={50}
        y={50}
        constraintsRef={constraintsRef}
        isMobile={true}
        onNameChange={onNameChange}
        onNumberChange={onNumberChange}
      />
    );

    // Click/tap the token (which is represented by the name text in the DOM)
    const nameLabel = screen.getByText('Ronaldo');
    fireEvent.click(nameLabel);

    // Verify the bottom sheet contents are present in the DOM (rendered via Portal)
    expect(screen.getByText('Detalles del Jugador')).toBeInTheDocument();
    
    const nameInput = screen.getByPlaceholderText('Nombre del jugador') as HTMLInputElement;
    const numberInput = screen.getByPlaceholderText('Número') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();
    expect(numberInput).toBeInTheDocument();
    expect(nameInput.value).toBe('Ronaldo');
    expect(numberInput.value).toBe('7');

    // Make changes
    fireEvent.change(nameInput, { target: { value: 'CR7' } });
    fireEvent.change(numberInput, { target: { value: '77' } });

    // Click Save
    const saveBtn = screen.getByText('Guardar Cambios');
    fireEvent.click(saveBtn);

    // Verify callbacks are triggered
    expect(onNameChange).toHaveBeenCalledWith('CR7');
    expect(onNumberChange).toHaveBeenCalledWith(77);
  });
});

