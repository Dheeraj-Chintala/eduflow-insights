import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export async function invokeEdgeFunction(functionName: string, options: any) {
  try {
    const res = await supabase.functions.invoke(functionName, options);

    if (res.error) {
      // If SDK parsed an error
      if (res.error instanceof FunctionsHttpError) {
        try {
          const errorBody = await res.error.context.json();
          console.error("Edge function error body:", errorBody);
          return { data: null, error: errorBody };
        } catch (jsonErr) {
          console.error("Error parsing error context:", jsonErr);
          return { data: null, error: res.error };
        }
      }
      return { data: null, error: res.error };
    }

    return { data: res.data, error: null };
  } catch (err) {
    console.error("invokeEdgeFunction unexpected error:", err);
    return { data: null, error: err };
  }
}
