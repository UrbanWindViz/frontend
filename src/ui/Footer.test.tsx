import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { describe, it, expect } from "vitest";

describe("Footer Component", () => {
  it("should render OSM attribution links", () => {
    render(<Footer backendUp={true} lastCheck={new Date()} />);

    const osmLink = screen.getByText(/OpenStreetMap/i);
    expect(osmLink).toBeInTheDocument();
    expect(osmLink.closest("a")).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright",
    );
  });

  it("should render MapLibre attribution", () => {
    render(<Footer backendUp={true} lastCheck={new Date()} />);

    const mapLibreLink = screen.getByText(/MapLibre GL/i);
    expect(mapLibreLink).toBeInTheDocument();
    expect(mapLibreLink.closest("a")).toHaveAttribute(
      "href",
      "https://maplibre.org/",
    );
  });

  it("should show 'UP' status when backend is up", () => {
    render(<Footer backendUp={true} lastCheck={new Date()} />);

    expect(screen.getByText("Backend: UP")).toBeInTheDocument();
  });

  it("should show 'DOWN' status when backend is down", () => {
    render(<Footer backendUp={false} lastCheck={new Date()} />);

    expect(screen.getByText("Backend: DOWN")).toBeInTheDocument();
  });

  it("should show 'CHECKING…' status when backend status is unknown", () => {
    render(<Footer backendUp={null} lastCheck={null} />);

    expect(screen.getByText("Backend: CHECKING…")).toBeInTheDocument();
  });

  it("should display last check time when provided", () => {
    const testDate = new Date("2025-01-17T12:00:00Z");
    render(<Footer backendUp={true} lastCheck={testDate} />);

    const timeString = testDate.toLocaleTimeString();
    expect(screen.getByText(timeString)).toBeInTheDocument();
  });

  it("should not display time when lastCheck is null", () => {
    const { container } = render(<Footer backendUp={null} lastCheck={null} />);

    const timeElement = container.querySelector(".footer-status-time");
    expect(timeElement).not.toBeInTheDocument();
  });

  it("should apply correct CSS class for up status", () => {
    const { container } = render(
      <Footer backendUp={true} lastCheck={new Date()} />,
    );

    const statusDiv = container.querySelector(".footer-status");
    expect(statusDiv).toHaveClass("up");
  });

  it("should apply correct CSS class for down status", () => {
    const { container } = render(
      <Footer backendUp={false} lastCheck={new Date()} />,
    );

    const statusDiv = container.querySelector(".footer-status");
    expect(statusDiv).toHaveClass("down");
  });

  it("should apply correct CSS class for checking status", () => {
    const { container } = render(<Footer backendUp={null} lastCheck={null} />);

    const statusDiv = container.querySelector(".footer-status");
    expect(statusDiv).toHaveClass("checking");
  });
});
