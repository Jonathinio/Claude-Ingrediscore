import Foundation

enum ProductEndpoints {
    static let lookupBarcode = "/v1/products/lookup-barcode"
    static func productDetail(id: String) -> String { "/v1/products/\(id)" }
    static func reanalyze(id: String) -> String { "/v1/products/\(id)/reanalyze" }
}
