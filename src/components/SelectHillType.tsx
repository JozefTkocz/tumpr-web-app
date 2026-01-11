import { MenuItem, Select } from "@mui/material";
import { hillType } from "../hooks/useHillData.tsx";
import type { SelectChangeEvent } from "@mui/material";

function populateOptions(): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  for (const [name, code] of Object.entries(hillType)) {
    options.push({ value: code, label: name });
  }
  return options;
}

export const hillOptions = populateOptions();

export function SelectHillType({
  hillClassification,
  onChange,
}: {
  hillClassification: string;
  onChange: (event: SelectChangeEvent) => void;
}) {
  return (
    <Select
      fullWidth
      value={hillClassification}
      label="Classification"
      onChange={onChange}
      sx={{
        textAlign: "center",
        borderRadius: 2, // rounded corners
        backgroundColor: "background.paper",
        boxShadow: 1, // subtle shadow
        "& .MuiSelect-select": {
          paddingY: 1, // vertical padding
          paddingX: 2, // horizontal padding
        },
      }}
    >
      {hillOptions.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </Select>
  );
}
