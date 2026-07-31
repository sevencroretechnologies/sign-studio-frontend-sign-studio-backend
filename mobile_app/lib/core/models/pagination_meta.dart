/// Pagination metadata as emitted by the backend `ApiResponse` trait under the
/// top-level `meta` key.
class PaginationMeta {
  const PaginationMeta({
    required this.currentPage,
    required this.perPage,
    required this.total,
    required this.totalPages,
    required this.hasMorePages,
    this.from,
    this.to,
  });

  final int currentPage;
  final int perPage;
  final int total;
  final int totalPages;
  final bool hasMorePages;
  final int? from;
  final int? to;

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    int asInt(Object? v, [int fallback = 0]) =>
        v is int ? v : int.tryParse('$v') ?? fallback;

    return PaginationMeta(
      currentPage: asInt(json['current_page'], 1),
      perPage: asInt(json['per_page'], 0),
      total: asInt(json['total'], 0),
      // Backend uses `total_pages`; fall back to `last_page` for safety.
      totalPages: asInt(json['total_pages'] ?? json['last_page'], 1),
      hasMorePages: json['has_more_pages'] as bool? ??
          (asInt(json['current_page'], 1) <
              asInt(json['total_pages'] ?? json['last_page'], 1)),
      from: json['from'] == null ? null : asInt(json['from']),
      to: json['to'] == null ? null : asInt(json['to']),
    );
  }
}

/// A paginated list response: the flat `data` array plus its [meta].
class PaginatedResponse<T> {
  const PaginatedResponse({
    required this.items,
    required this.meta,
  });

  final List<T> items;
  final PaginationMeta meta;

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic> item) fromItem,
  ) {
    final rawList = (json['data'] as List? ?? const [])
        .whereType<Map>()
        .map((e) => fromItem(e.cast<String, dynamic>()))
        .toList();

    final rawMeta = json['meta'];
    return PaginatedResponse<T>(
      items: rawList,
      meta: rawMeta is Map
          ? PaginationMeta.fromJson(rawMeta.cast<String, dynamic>())
          : PaginationMeta(
              currentPage: 1,
              perPage: rawList.length,
              total: rawList.length,
              totalPages: 1,
              hasMorePages: false,
            ),
    );
  }
}
