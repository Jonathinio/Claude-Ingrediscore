import Foundation

struct FirestoreDocumentListDTO: Decodable, Sendable {
    let documents: [FirestoreDocumentDTO]
}

struct FirestoreDocumentDTO: Decodable, Sendable {
    let name: String
    let fields: [String: FirestoreValueDTO]
}

enum FirestoreValueDTO: Decodable, Sendable {
    case string(String)
    case integer(Int)
    case double(Double)
    case boolean(Bool)
    case timestamp(String)
    case array([FirestoreValueDTO])
    case map([String: FirestoreValueDTO])
    case null

    private enum CodingKeys: String, CodingKey {
        case stringValue
        case integerValue
        case doubleValue
        case booleanValue
        case timestampValue
        case arrayValue
        case mapValue
        case nullValue
        case values
        case fields
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        if let value = try container.decodeIfPresent(String.self, forKey: .stringValue) {
            self = .string(value)
        } else if let value = try container.decodeIfPresent(String.self, forKey: .integerValue), let intValue = Int(value) {
            self = .integer(intValue)
        } else if let value = try container.decodeIfPresent(Double.self, forKey: .doubleValue) {
            self = .double(value)
        } else if let value = try container.decodeIfPresent(Bool.self, forKey: .booleanValue) {
            self = .boolean(value)
        } else if let value = try container.decodeIfPresent(String.self, forKey: .timestampValue) {
            self = .timestamp(value)
        } else if container.contains(.arrayValue) {
            let arrayContainer = try container.nestedContainer(keyedBy: CodingKeys.self, forKey: .arrayValue)
            let values = try arrayContainer.decodeIfPresent([FirestoreValueDTO].self, forKey: .values) ?? []
            self = .array(values)
        } else if container.contains(.mapValue) {
            let mapContainer = try container.nestedContainer(keyedBy: CodingKeys.self, forKey: .mapValue)
            let fields = try mapContainer.decodeIfPresent([String: FirestoreValueDTO].self, forKey: .fields) ?? [:]
            self = .map(fields)
        } else {
            self = .null
        }
    }
}

extension Dictionary where Key == String, Value == FirestoreValueDTO {
    func string(_ key: String) -> String? {
        if case .string(let value)? = self[key] { return value }
        return nil
    }

    func integer(_ key: String) -> Int? {
        switch self[key] {
        case .integer(let value):
            return value
        case .string(let value):
            return Int(value)
        default:
            return nil
        }
    }

    func double(_ key: String) -> Double? {
        switch self[key] {
        case .double(let value):
            return value
        case .integer(let value):
            return Double(value)
        default:
            return nil
        }
    }

    func bool(_ key: String) -> Bool? {
        if case .boolean(let value)? = self[key] { return value }
        return nil
    }

    func timestampDate(_ key: String) -> Date? {
        guard case .timestamp(let value)? = self[key] else { return nil }
        return ISO8601DateFormatter().date(from: value)
    }

    func stringArray(_ key: String) -> [String] {
        guard case .array(let values)? = self[key] else { return [] }
        return values.compactMap {
            if case .string(let value) = $0 { return value }
            return nil
        }
    }

    func map(_ key: String) -> [String: FirestoreValueDTO]? {
        guard case .map(let value)? = self[key] else { return nil }
        return value
    }

    func mapArray(_ key: String) -> [[String: FirestoreValueDTO]] {
        guard case .array(let values)? = self[key] else { return [] }
        return values.compactMap {
            if case .map(let value) = $0 { return value }
            return nil
        }
    }
}
