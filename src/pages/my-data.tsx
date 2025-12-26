import { Box, Button } from "@mui/material";
import React, { useEffect, useState } from "react";
import * as z from "zod";
import { useBaggedStatus } from "../hooks/baggedStatus.ts";
import { DataLoadingSpinner } from "../components/LoadingSpinner.tsx";

const databaseSchema = z.array(
  z
    .object({
      id: z.string(),
    })
    .strict(),
);

export function FileUploadButton({
  handleChange,
}: {
  handleChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  return (
    <Button variant="contained" component="label">
      Upload file
      <input type="file" hidden onChange={handleChange} />
    </Button>
  );
}

function useParseJSONFile<T>(schema: z.ZodType<T>) {
  const [file, setFile] = useState<File | undefined>(undefined);
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") return;

        setData(schema.parse(JSON.parse(text)));
      } catch (err) {
        console.error("Invalid JSON file", err);
        setData(null);
      }
    };

    reader.readAsText(file);
  }, [file]);

  return {
    fileData: data,
    setFile,
  };
}

export function MyData() {
  const { data, bulkMarkAsBagged, isReady } = useBaggedStatus();

  const { fileData, setFile } = useParseJSONFile(databaseSchema);
  useEffect(() => {
    if (fileData) {
      bulkMarkAsBagged(fileData as unknown as Array<{ id: number }>);
    }
  }, [fileData]);

  const explanationText =
    "Use this page to access and manage your bagged summit data.";
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignContent="center"
    >
      <p>{explanationText}</p>
      {isReady
        ? (
          <Button
            href={`data:text/json;charset=utf-8,${
              encodeURIComponent(
                JSON.stringify(data),
              )
            }`}
            download="bagged-summits.json"
          >
            {`Download data backup file`}
          </Button>
        )
        : <DataLoadingSpinner text="Loading bagged summits..." />}
      <FileUploadButton handleChange={(e) => setFile(e.target.files?.[0])} />
      {fileData && JSON.stringify(fileData)}
    </Box>
  );
}
