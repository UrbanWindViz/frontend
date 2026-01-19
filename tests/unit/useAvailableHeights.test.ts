import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAvailableHeights } from "../../src/hooks/useAvailableHeights";
import * as datasetsApi from "../../src/api/datasets";
import { createMockDatasetInfo } from "../../src/test/mocks";

// Mock the API module
vi.mock("../../src/api/datasets");

describe("useAvailableHeights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and extract heights from datasets on mount", async () => {
    const mockDatasets = [
      createMockDatasetInfo({ availableHeightsMeters: [10, 50] }),
      createMockDatasetInfo({ availableHeightsMeters: [100, 150] }),
    ];

    vi.mocked(datasetsApi.fetchDatasets).mockResolvedValue(mockDatasets);

    const { result } = renderHook(() => useAvailableHeights());

    // Initially loading
    expect(result.current.loading).toBe(true);
    expect(result.current.heights).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have all heights from both datasets
    expect(result.current.heights).toEqual([10, 50, 100, 150]);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch errors gracefully", async () => {
    const mockError = new Error("Network error");
    vi.mocked(datasetsApi.fetchDatasets).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAvailableHeights());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.heights).toEqual([]);
    expect(result.current.error).toBe(mockError);
  });

  it("should call fetchDatasets with abort signal", async () => {
    vi.mocked(datasetsApi.fetchDatasets).mockResolvedValue([]);

    renderHook(() => useAvailableHeights());

    expect(datasetsApi.fetchDatasets).toHaveBeenCalledWith(
      expect.any(AbortSignal)
    );
  });

  it("should abort fetch on unmount", async () => {
    vi.mocked(datasetsApi.fetchDatasets).mockImplementation(
      (signal) =>
        new Promise((resolve, reject) => {
          signal?.addEventListener("abort", () => reject({ name: "AbortError" }));
        })
    );

    const { unmount } = renderHook(() => useAvailableHeights());

    unmount();

    // AbortError should not be logged
    expect(datasetsApi.fetchDatasets).toHaveBeenCalled();
  });
});
