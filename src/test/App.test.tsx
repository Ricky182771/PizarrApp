import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders title and tool buttons', async () => {
    render(<App />);
    
    // Check that header/footer title contains "PizarrApp"
    expect(screen.getByText(/PizarrApp/)).toBeInTheDocument();
    
    // Open the Extras dropdown first
    const extrasBtn = await screen.findByTitle('Extras');
    expect(extrasBtn).toBeInTheDocument();
    fireEvent.click(extrasBtn);

    // Verify the extras dropdown items are now in the DOM
    expect(screen.getByText('Balón')).toBeInTheDocument();
    expect(screen.getByText('Cono')).toBeInTheDocument();
    expect(screen.getByText('Línea')).toBeInTheDocument();
    expect(screen.getByText('Texto')).toBeInTheDocument();
  });

  it('can switch team presets between Fútbol 7 and Fútbol 11', async () => {
    render(<App />);

    // Open the Team Configuration panel first
    const configBtn = await screen.findByTitle('Configurar alineación y uniformes');
    expect(configBtn).toBeInTheDocument();
    fireEvent.click(configBtn);

    // By default GK, Ramos, etc. are loaded (11 players per team)
    const f7Btns = screen.getAllByText('F7');
    expect(f7Btns).toHaveLength(2); // One for local, one for visitor

    // Switch Local to F7
    fireEvent.click(f7Btns[0]);
    
    // Verify local GK is still rendered (there are 2 GKs total)
    expect(screen.getAllByText('GK').length).toBeGreaterThan(0);
  });

  it('can add a local player via the + button', async () => {
    render(<App />);

    // Open the Team Configuration panel first
    const configBtn = await screen.findByTitle('Configurar alineación y uniformes');
    expect(configBtn).toBeInTheDocument();
    fireEvent.click(configBtn);

    const addLocalBtn = await screen.findByTitle('Añadir jugador local');
    expect(addLocalBtn).toBeInTheDocument();

    // Visitor team has player number 5 (Stones), so '5' is found once initially
    expect(screen.getAllByText('5')).toHaveLength(1);

    fireEvent.click(addLocalBtn);
    
    // Renders the new player (should have a default number of 5, so now '5' is found twice)
    expect(screen.getAllByText('5')).toHaveLength(2);
  });
});
