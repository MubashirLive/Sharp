import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAuth as useAuthHook } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function TestComponent() {
  const { user, refresh, signOut } = useAuthHook();
  const { user: authUser } = useAuth();

  return (
    <div>
      <div data-testid="user">{user?.email || "No user"}</div>
      <div data-testid="auth-user">{authUser?.email || "No auth user"}</div>
      <button onClick={refresh}>Refresh</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("No user");
  });

  it("should handle user refresh", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </QueryClientProvider>
    );

    const refreshButton = screen.getByText("Refresh");
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId("user")).toBeInTheDocument();
    });
  });
});