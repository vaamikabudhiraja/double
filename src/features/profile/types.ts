/** The editable slice of a profile shown in the You tab. */
export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  new_to_dublin: boolean;
}
