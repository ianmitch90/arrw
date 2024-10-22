interface FormErrorProps {
  error?: string;
  touched?: boolean;
}

export const FormError = ({ error, touched }: FormErrorProps) => {
  if (!touched || !error) return null;

  return <div className="text-red-500 text-sm mt-1">{error}</div>;
};
