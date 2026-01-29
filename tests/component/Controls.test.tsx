import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../src/test/utils";
import { Controls } from "../../src/ui/Controls";
import * as hooks from "../../src/hooks";
import * as urlStats from "../../src/util/urlStats";
import * as animation from "../../src/util/animation";
import * as weatherApi from "../../src/api/weather";
import { createMockWeatherTimestep } from "../../src/test/mocks";

// Mock all external dependencies
vi.mock("../../src/hooks");
vi.mock("../../src/util/urlStats");
vi.mock("../../src/util/animation");
vi.mock("../../src/api/weather");

const defaultProps = {
  loading: false,
  onGeneratePermalink: vi.fn(),
  permalinkCopied: false,
  mapCenter: { lon: 13.4, lat: 52.5 },
  queryInProgress: false,
  onQueryControls: vi.fn(),
};

function setupMocks(overrides?: {
  heights?: number[];
  timesteps?: ReturnType<typeof createMockWeatherTimestep>[];
  urlState?: Partial<ReturnType<typeof urlStats.parseUrlState>>;
  weatherLoading?: boolean;
}) {
  const heights = overrides?.heights ?? [50, 60, 100];
  const timesteps = overrides?.timesteps ?? [
    createMockWeatherTimestep({ label: "12:00", wsRef: 5.0, wdRef: 270 }),
    createMockWeatherTimestep({ label: "13:00", wsRef: 6.0, wdRef: 280 }),
  ];

  vi.mocked(hooks.useAvailableHeights).mockReturnValue({
    heights,
    loading: false,
    error: null,
  });

  vi.mocked(hooks.useWeatherData).mockReturnValue({
    timesteps,
    hourlyData: timesteps,
    loading: overrides?.weatherLoading ?? false,
    currentWeather: timesteps[0],
  });

  vi.mocked(urlStats.useUrlState).mockReturnValue({
    heightMeters: undefined,
    ...overrides?.urlState,
  });

  vi.mocked(animation.useAnimation).mockReturnValue({
    currentIndex: 0,
    setCurrentIndex: vi.fn(),
  });

  vi.mocked(weatherApi.getDefaultDate).mockReturnValue("2025-01-17");
}

describe("Controls Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  // Helper to get the height selector specifically
  function getHeightSelector() {
    const label = screen.getByText("Höhe");
    const controlGroup = label.closest(".control-group");
    return controlGroup?.querySelector("select") as HTMLSelectElement;
  }

  describe("Initial Rendering", () => {
    it("should render the controls panel with title", () => {
      render(<Controls {...defaultProps} />);

      expect(screen.getByText("UrbanWindViz")).toBeInTheDocument();
    });

    it("should render height selector with available heights", () => {
      setupMocks({ heights: [50, 60, 100] });
      render(<Controls {...defaultProps} />);

      const select = getHeightSelector();
      expect(select).toBeInTheDocument();

      expect(screen.getByText("50 m")).toBeInTheDocument();
      expect(screen.getByText("60 m")).toBeInTheDocument();
      expect(screen.getByText("100 m")).toBeInTheDocument();
    });

    it("should show placeholder when no heights available", () => {
      setupMocks({ heights: [] });
      render(<Controls {...defaultProps} />);

      expect(screen.getByText("(keine Höhen verfügbar)")).toBeInTheDocument();
    });

    it("should render permalink button", () => {
      render(<Controls {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /link kopieren/i }),
      ).toBeInTheDocument();
    });

    it("should show Ready status when not loading", () => {
      render(<Controls {...defaultProps} loading={false} />);

      expect(screen.getByText("Ready")).toBeInTheDocument();
    });

    it("should show Loading status when loading", () => {
      render(<Controls {...defaultProps} loading={true} />);

      expect(screen.getByText("Loading…")).toBeInTheDocument();
    });
  });

  describe("Height Selection", () => {
    it("should auto-select first height when heights load and none selected", () => {
      setupMocks({ heights: [50, 60, 100] });
      render(<Controls {...defaultProps} />);

      const select = getHeightSelector();
      expect(select.value).toBe("50");
    });

    it("should use height from URL state if provided", () => {
      setupMocks({
        heights: [50, 60, 100],
        urlState: { heightMeters: 60 },
      });
      render(<Controls {...defaultProps} />);

      const select = getHeightSelector();
      expect(select.value).toBe("60");
    });

    it("should call onQueryControls when height changes", () => {
      const onQueryControls = vi.fn();
      setupMocks({ heights: [50, 60, 100] });
      render(<Controls {...defaultProps} onQueryControls={onQueryControls} />);

      const select = getHeightSelector();
      fireEvent.change(select, { target: { value: "100" } });

      expect(onQueryControls).toHaveBeenCalled();
    });

    it("should disable height selector when no heights available", () => {
      setupMocks({ heights: [] });
      render(<Controls {...defaultProps} />);

      const select = getHeightSelector();
      expect(select).toBeDisabled();
    });
  });

  describe("Collapse/Expand Behavior", () => {
    it("should collapse when close button is clicked", () => {
      render(<Controls {...defaultProps} />);

      const closeButton = screen.getByTitle("Einstellungen minimieren");
      fireEvent.click(closeButton);

      // Panel should be collapsed - title should not be visible
      expect(screen.queryByText("UrbanWindViz")).not.toBeInTheDocument();
    });

    it("should show collapsed button when collapsed", () => {
      render(<Controls {...defaultProps} />);

      const closeButton = screen.getByTitle("Einstellungen minimieren");
      fireEvent.click(closeButton);

      const expandButton = screen.getByTitle("Einstellungen öffnen");
      expect(expandButton).toBeInTheDocument();
    });

    it("should expand when collapsed button is clicked", () => {
      render(<Controls {...defaultProps} />);

      // First collapse
      const closeButton = screen.getByTitle("Einstellungen minimieren");
      fireEvent.click(closeButton);

      // Then expand
      const expandButton = screen.getByTitle("Einstellungen öffnen");
      fireEvent.click(expandButton);

      // Panel should be expanded again
      expect(screen.getByText("UrbanWindViz")).toBeInTheDocument();
    });
  });

  describe("Permalink Functionality", () => {
    it("should call onGeneratePermalink when button is clicked", () => {
      const onGeneratePermalink = vi.fn();
      render(
        <Controls
          {...defaultProps}
          onGeneratePermalink={onGeneratePermalink}
        />,
      );

      const button = screen.getByRole("button", { name: /link kopieren/i });
      fireEvent.click(button);

      expect(onGeneratePermalink).toHaveBeenCalledTimes(1);
    });

    it("should show confirmation message when permalink is copied", () => {
      render(<Controls {...defaultProps} permalinkCopied={true} />);

      expect(screen.getByText("✓ Link kopiert!")).toBeInTheDocument();
    });

    it("should not show confirmation when permalink is not copied", () => {
      render(<Controls {...defaultProps} permalinkCopied={false} />);

      expect(screen.queryByText("✓ Link kopiert!")).not.toBeInTheDocument();
    });
  });

  describe("TimeControl Integration", () => {
    it("should render TimeControl when timesteps are available", () => {
      setupMocks({
        timesteps: [
          createMockWeatherTimestep({ label: "12:00" }),
          createMockWeatherTimestep({ label: "13:00" }),
        ],
      });
      render(<Controls {...defaultProps} />);

      // TimeControl shows current timestep label
      expect(screen.getByText("12:00")).toBeInTheDocument();
    });

    it("should not render TimeControl when no timesteps", () => {
      setupMocks({ timesteps: [] });
      render(<Controls {...defaultProps} />);

      // TimeControl returns null when no timesteps
      expect(screen.queryByText(/m\/s @/)).not.toBeInTheDocument();
    });
  });

  describe("Query Controls Callback", () => {
    it("should call onQueryControls with null when height is not selected", () => {
      const onQueryControls = vi.fn();
      setupMocks({ heights: [] });
      render(<Controls {...defaultProps} onQueryControls={onQueryControls} />);

      expect(onQueryControls).toHaveBeenCalledWith(null);
    });

    it("should call onQueryControls with weather data when height and weather are available", () => {
      const onQueryControls = vi.fn();
      setupMocks({
        heights: [50, 60],
        timesteps: [createMockWeatherTimestep({ wsRef: 5.5, wdRef: 180 })],
      });
      render(<Controls {...defaultProps} onQueryControls={onQueryControls} />);

      // Should be called with query controls including height and weather
      expect(onQueryControls).toHaveBeenCalledWith(
        expect.objectContaining({
          heightMeters: 50,
          wsRef: 5.5,
          wdRef: 180,
        }),
      );
    });
  });

  describe("Hooks Integration", () => {
    it("should call useAvailableHeights hook", () => {
      render(<Controls {...defaultProps} />);

      expect(hooks.useAvailableHeights).toHaveBeenCalled();
    });

    it("should call useWeatherData with map center coordinates", () => {
      render(
        <Controls {...defaultProps} mapCenter={{ lon: 13.4, lat: 52.5 }} />,
      );

      expect(hooks.useWeatherData).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 52.5,
          lon: 13.4,
        }),
        expect.any(Number),
      );
    });

    it("should call useAnimation with correct parameters", () => {
      setupMocks({
        timesteps: [
          createMockWeatherTimestep(),
          createMockWeatherTimestep(),
          createMockWeatherTimestep(),
        ],
      });
      render(<Controls {...defaultProps} queryInProgress={false} />);

      expect(animation.useAnimation).toHaveBeenCalledWith(
        3, // timestep count
        1, // default playback speed
        false, // not playing by default
      );
    });
  });
});
