import { CloseIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormErrorMessage,
  IconButton,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";

interface ImageUploadInputProps {
  name: string;
  value?: File;
  onChange?: (files: File) => void;
  error?: string;
}

const ImageUploadInput: React.FC<ImageUploadInputProps> = ({ name, value = undefined, onChange, error }) => {
  // Local state to store the file and its preview URL
  const [uploads, setUploads] = useState<{ file: File; preview: string }[]>(() => {
    if (value) {
      return [
        {
          file: value,
          preview: URL.createObjectURL(value),
        },
      ];
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Update uploads when value prop changes
  useEffect(() => {
    if (value) {
      setUploads([
        {
          file: value,
          preview: URL.createObjectURL(value),
        },
      ]);
    } else {
      setUploads([]);
    }
  }, [value]);

  // Clean-up the generated object URLs when the component unmounts.
  useEffect(() => {
    return () => {
      uploads.forEach((upload) => URL.revokeObjectURL(upload.preview));
    };
  }, [uploads]);

  // Handle file selection.
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      // Map the files to our uploads state format.
      const newUploads = Array.from(selectedFiles).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      // if not multiple, clean up any previous preview URLs.
      uploads.forEach((upload) => URL.revokeObjectURL(upload.preview));
      setUploads(newUploads);
      // Invoke the onChange handler if provided.
      if (onChange) {
        onChange(newUploads[0].file);
      }
    }
  };

  // Remove an image from uploads.
  const handleDelete = (index: number) => {
    const uploadToDelete = uploads[index];
    if (uploadToDelete) {
      URL.revokeObjectURL(uploadToDelete.preview);
    }
    const updatedUploads = uploads.filter((_, i) => i !== index);
    setUploads(updatedUploads);
    if (onChange) {
      onChange(updatedUploads[0].file);
    }
  };

  // Programmatically trigger the hidden file input.
  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <FormControl isInvalid={!!error}>
      <Card>
        <CardBody>
          {/* Hidden file input */}
          <input
            id={name}
            name={name}
            type="file"
            style={{ display: "none" }}
            accept="image/jpeg,image/png,image/webp"
            ref={inputRef}
            onChange={handleInputChange}
            data-testid="image-upload-input"
          />
          <Button variant="outline" onClick={handleClick} data-testid="image-upload-button">
            Select Image
          </Button>

          {/* Display previews if any image is uploaded */}
          {uploads.length > 0 && (
            <SimpleGrid columns={[2, 3, 4]} spacing="10px" mt={4} data-testid="image-preview-grid">
              {uploads.map((upload, index) => (
                <Box key={index} position="relative" width="100px" height="100px">
                  <Image
                    src={upload.preview}
                    alt="Uploaded preview"
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    borderRadius="md"
                    data-testid={`image-preview-${index}`}
                  />
                  <IconButton
                    icon={<CloseIcon />}
                    size="xs"
                    aria-label="Remove image"
                    position="absolute"
                    top="2px"
                    right="2px"
                    onClick={() => handleDelete(index)}
                    borderRadius="full"
                    data-testid={`image-delete-button-${index}`}
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}
          {error && <FormErrorMessage>{error}</FormErrorMessage>}
        </CardBody>
      </Card>
    </FormControl>
  );
};

export default ImageUploadInput;
