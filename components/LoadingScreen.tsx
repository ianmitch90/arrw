import { Spinner } from "@nextui-org/spinner";

export default function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Spinner 
        size="lg"
        color="primary"
        labelColor="primary"
        label="Loading..."
      />
    </div>
  );
}
