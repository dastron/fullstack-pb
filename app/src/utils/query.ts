import pb from "@/pb";

export const getQueryFilter = (urlRaw: string) => {
  const userId = pb.authStore.model?.id;

  const url = new URL(urlRaw);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "all";
  const mine = url.searchParams.get("mine") || "false";

  const filter = [];

  if (search !== "" && search !== undefined) {
    filter.push(pb.filter("content ~ {:search}", { search }));
  }

  if (status !== "all" && status !== undefined) {
    filter.push(pb.filter("status={:status}", { status: status }));
  }

  if (mine !== "false" && userId !== undefined) {
    filter.push(pb.filter("(AuthorUser={:id} || SubscriberUsers~{:id})", { id: userId }));
  }

  return filter.length > 0 ? filter.join(" && ") : undefined;
};

export const getQuerySort = (urlRaw: string) => {
  const url = new URL(urlRaw);
  const sortBy = url.searchParams.get("sortBy") || "-updated";
  return sortBy;
};

export const getQueryParams = (urlRaw: string) => {
  const filter = getQueryFilter(urlRaw);
  const sort = getQuerySort(urlRaw);
  return { filter, sort };
};
