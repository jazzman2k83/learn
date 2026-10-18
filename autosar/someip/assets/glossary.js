/*
 * The course glossary: one list of AUTOSAR terms with a one-line meaning. It feeds
 *   - the hover help on every page: <code class="term">TTL</code> or <span class="term">eventgroup</span>
 *     shows the meaning on hover, focus or tap. The text is looked up (case does not matter,
 *     a trailing plural "s" is ignored); data-term="..." looks up another key instead.
 *   - reference/words.html, which lists every entry.
 * A term marked in a page but missing here is reported in the console.
 * Each entry: t = term, also = other spellings that find it, m = meaning, l = lessons that teach it.
 */
(function () {
  const TERMS = [
    // The big picture
    { t: 'SOME/IP', m: 'Scalable service-Oriented MiddlewarE over IP: the protocol that lets ECUs offer and use services over Ethernet.', l: [1] },
    { t: 'service-oriented communication', m: 'Communication organised around services: a server offers a service, and clients find it and use it, instead of fixed signals sent on a fixed schedule.', l: [1] },
    { t: 'server', m: 'The ECU (or SWC) that provides a service instance: it sends its events, answers its methods and holds its fields.', l: [1, 10] },
    { t: 'client', m: 'An ECU (or SWC) that uses a service instance: it subscribes to events, calls methods and reads or writes fields.', l: [1, 10] },
    { t: 'SOME/IP header', also: ['header'], m: 'The 16 bytes in front of every SOME/IP message: Message ID, Length, Request ID, Protocol Version, Interface Version, Message Type and Return Code.', l: [1, 4, 28] },
    { t: 'serialization', m: 'Writing the data of an SWC out as a sequence of bytes on the wire (the payload), in a fixed order; deserialization reads it back.', l: [1, 29] },
    { t: 'service', m: 'A set of events, methods and fields that belong together, described by a service interface and identified by a Service ID.', l: [2] },
    { t: 'service interface', m: 'The description of a service: its events, methods and fields with their data types and its version.', l: [2] },
    { t: 'service instance', also: ['instance'], m: 'One running copy of a service, identified by Service ID plus Instance ID. Several ECUs can offer the same service as different instances.', l: [2] },
    { t: 'Service ID', m: '16-bit number that identifies a service (a service interface).', l: [2, 4] },
    { t: 'Instance ID', m: '16-bit number that tells apart several instances of the same service. It is carried in Service Discovery, not in the SOME/IP header.', l: [2, 11] },
    { t: 'event', m: 'A message the server sends on its own, without being asked: something happened or a value changed. Clients receive it only after subscribing to its eventgroup.', l: [2, 5] },
    { t: 'method', m: 'A function of the server that a client calls: with a response (request/response) or without one (fire&forget).', l: [2, 6, 7] },
    { t: 'field', m: 'A value the server owns, with up to three parts: a getter (read it), a setter (change it) and a notifier (an event sent when it changes).', l: [2, 8] },
    { t: 'getter', m: 'The part of a field that lets a client read its current value: a method with a response.', l: [2, 8] },
    { t: 'setter', m: 'The part of a field that lets a client change its value: a method whose response carries the value actually set.', l: [2, 8] },
    { t: 'notifier', m: 'The part of a field that sends an event to subscribed clients when the value changes.', l: [2, 8] },
    { t: 'eventgroup', m: 'A set of events and fields that a server publishes together, identified by an Eventgroup ID. Clients subscribe to an eventgroup, never to a single event.', l: [2, 14] },
    { t: 'Eventgroup ID', m: '16-bit number that identifies an eventgroup within a service.', l: [2, 14] },
    { t: 'Method ID', m: '16-bit number that identifies a method within a service. Together with the Service ID it forms the Message ID.', l: [2, 4] },
    { t: 'Event ID', m: '16-bit number that identifies an event (or field notifier) within a service; its highest bit is 1, which tells it apart from a Method ID.', l: [2, 4] },
    { t: 'major version', m: 'The version of a service interface that must match exactly between server and client; carried in the header as Interface Version and in SD entries.', l: [2, 4, 11] },
    { t: 'minor version', m: 'The compatible part of a service version: a client accepts a server with the same major version and a suitable minor version. Carried in SD entries only.', l: [2, 11] },
    { t: 'request/response', m: 'A method call where the client sends a REQUEST and the server answers with a RESPONSE or an ERROR.', l: [2, 6] },
    { t: 'fire&forget', also: ['fire-and-forget'], m: 'A method call without a response: the client sends a REQUEST_NO_RETURN and gets nothing back, not even an error.', l: [2, 7] },
    { t: 'SWC', also: ['software component'], m: 'Software component: application software above the RTE that provides or uses services.', l: [3] },
    { t: 'RTE', m: 'Runtime Environment: connects the SWCs to each other and to the basic software; it calls the transformers for SOME/IP data.', l: [3] },
    { t: 'SOME/IP transformer', also: ['transformer'], m: 'Module called by the RTE that serializes the data of an SWC into a SOME/IP message (header included) and back.', l: [3, 20, 24] },
    { t: 'COM', m: 'Communication module: carries signals and I-PDUs between the RTE and the PduR; for SOME/IP the whole message travels as one byte-array signal.', l: [3, 24] },
    { t: 'LdCom', m: 'Large Data COM: a lean alternative to COM that hands a whole I-PDU between the RTE and the PduR without signal handling.', l: [3, 24] },
    { t: 'PduR', also: ['PDU Router'], m: 'PDU Router: forwards I-PDUs between upper modules (COM, LdCom, Sd) and lower modules (SoAd, SOME/IP TP).', l: [3] },
    { t: 'SOME/IP TP', also: ['SomeIpTp'], m: 'SOME/IP Transport Protocol module: cuts a message that is too big for one UDP datagram into segments and joins them on reception.', l: [3, 23] },
    { t: 'SoAd', also: ['Socket Adaptor'], m: 'Socket Adaptor: maps PDUs to socket connections of TcpIp and back, and switches routes on and off with routing groups.', l: [3, 21] },
    { t: 'Sd', also: ['Service Discovery'], m: 'Service Discovery: the module that offers, finds and subscribes services by sending and receiving SOME/IP-SD messages.', l: [3, 11] },
    { t: 'TcpIp', m: 'The TCP/IP stack module: IP, UDP, TCP, ARP and the sockets that SoAd uses.', l: [3] },
    { t: 'EthIf', m: 'Ethernet Interface: hands Ethernet frames between TcpIp and the Ethernet driver, and sorts them by frame type (and VLAN).', l: [3, 19] },
    { t: 'Eth driver', also: ['Eth'], m: 'Ethernet driver: sends and receives Ethernet frames on the controller hardware.', l: [3] },
    { t: 'BswM', also: ['BSW Mode Manager'], m: 'BSW Mode Manager: decides which services are wanted and tells Sd; Sd reports the actual states back to it.', l: [3, 17] },
    { t: 'PDU', also: ['I-PDU'], m: 'Protocol Data Unit: a block of data handed between basic software modules, known by its PDU ID. An I-PDU is one at the interaction layer (COM, LdCom, PduR).', l: [3] },
    { t: 'segmentation', m: 'Cutting a SOME/IP message that is too big for one UDP datagram into segments (SOME/IP TP); the receiver reassembles them.', l: [3, 23] },
    { t: 'segment', m: 'One part of a segmented SOME/IP message: the SOME/IP header, the SOME/IP TP header and a slice of the payload.', l: [23, 32] },
    // Events, methods and fields
    { t: 'Message ID', m: 'The first 32 bits of the header: Service ID plus Method ID or Event ID. It says what the message is about.', l: [4, 28] },
    { t: 'Length', m: 'Header field: the number of bytes that follow it, from Request ID up to the end of the payload (8 + payload length).', l: [4, 28] },
    { t: 'Request ID', m: 'Header field: Client ID plus Session ID. A response carries the Request ID of its request, so the client can match the two.', l: [4, 6] },
    { t: 'Client ID', m: 'Header field (part of the Request ID) that tells apart the callers of a method on one ECU.', l: [4, 6] },
    { t: 'Session ID', m: 'Header field (part of the Request ID) that counts the calls or events; in SD messages it also serves reboot detection.', l: [4, 6, 16] },
    { t: 'session handling', m: 'Counting the Session ID up with every message (1, 2, … wrapping to 1). If it is off, the Session ID is always 0.', l: [4, 5] },
    { t: 'Protocol Version', m: 'Header field: the version of the SOME/IP protocol, currently 0x01.', l: [4, 28] },
    { t: 'Interface Version', m: 'Header field: the major version of the service interface.', l: [4, 28] },
    { t: 'Message Type', m: 'Header field that says what kind of message this is: REQUEST, REQUEST_NO_RETURN, NOTIFICATION, RESPONSE or ERROR (plus TP variants).', l: [4, 28] },
    { t: 'Return Code', m: 'Header field: E_OK (0x00) or an error code. Requests and notifications always carry E_OK.', l: [4, 9] },
    { t: 'payload', m: 'The data after the SOME/IP header: the serialized arguments, return values or event data.', l: [4, 29] },
    { t: 'REQUEST', m: 'Message Type 0x00: a method call that expects a response.', l: [4, 6] },
    { t: 'REQUEST_NO_RETURN', m: 'Message Type 0x01: a fire&forget method call; nothing comes back.', l: [4, 7] },
    { t: 'NOTIFICATION', also: ['Notification'], m: 'Message Type 0x02: an event (or field notifier) sent by the server without a request.', l: [4, 5] },
    { t: 'RESPONSE', m: 'Message Type 0x80: the answer to a REQUEST, with Return Code E_OK or an ApplicationError.', l: [4, 6] },
    { t: 'ERROR', m: 'Message Type 0x81: the answer to a REQUEST when something went wrong; the Return Code says what.', l: [4, 9] },
    { t: 'cyclic update', m: 'An event sent at a fixed period, whether or not the value changed.', l: [5] },
    { t: 'update on change', m: 'An event sent only when the value changes.', l: [5] },
    { t: 'epsilon change', m: 'An event sent only when the value changes by more than a set amount.', l: [5] },
    { t: 'subscriber', m: 'A client whose subscription to an eventgroup is currently accepted; the server sends it the events of that eventgroup.', l: [5, 14] },
    { t: 'transaction handle', m: 'What the RTE keeps for an asynchronous call (client ID and sequence counter) so it can match the response to the call.', l: [6, 20] },
    { t: 'E_OK', m: 'Return Code 0x00: no error.', l: [4, 9] },
    { t: 'E_NOT_OK', m: 'Return Code 0x01: an unspecified error occurred.', l: [9] },
    { t: 'E_UNKNOWN_SERVICE', m: 'Return Code 0x02: the requested Service ID is unknown.', l: [9] },
    { t: 'E_UNKNOWN_METHOD', m: 'Return Code 0x03: the requested Method ID is unknown in this service.', l: [9] },
    { t: 'E_NOT_READY', m: 'Return Code 0x04: the service is known but the application is not running.', l: [9] },
    { t: 'E_TIMEOUT', m: 'Return Code 0x06: no response arrived in time. In the RTE the call ends with RTE_E_TIMEOUT.', l: [6, 9] },
    { t: 'E_WRONG_PROTOCOL_VERSION', m: 'Return Code 0x07: the Protocol Version in the header is not supported.', l: [9] },
    { t: 'E_WRONG_INTERFACE_VERSION', m: 'Return Code 0x08: the Interface Version in the header does not match.', l: [9] },
    { t: 'E_MALFORMED_MESSAGE', m: 'Return Code 0x09: the payload could not be deserialized.', l: [9] },
    { t: 'E_WRONG_MESSAGE_TYPE', m: 'Return Code 0x0A: an unexpected Message Type was received.', l: [9] },
    { t: 'ApplicationError', also: ['application error', 'application errors'], m: 'An error defined by the method itself in the ClientServerOperation; it travels in the Return Code of a normal RESPONSE, moved into a range reserved for it.', l: [9] },
    { t: 'autonomous error reaction', m: 'The server side (transformer, not the SWC) sends an ERROR on its own, for example for a malformed request.', l: [9] },
    { t: 'SdServerService', m: 'Sd configuration container for one service instance this ECU offers as a server.', l: [10, 26] },
    { t: 'SdClientService', m: 'Sd configuration container for one service instance this ECU uses as a client.', l: [10, 26] },
    { t: 'event handler', also: ['SdEventHandler'], m: 'The server side of an eventgroup in the Sd configuration (SdEventHandler). REQUESTED while at least one client is subscribed, RELEASED when none is.', l: [10, 14, 17] },
    { t: 'consumed eventgroup', also: ['SdConsumedEventGroup'], m: 'The client side of an eventgroup in the Sd configuration (SdConsumedEventGroup). Sd reports it AVAILABLE once a SubscribeEventgroupAck arrives and DOWN when the subscription ends.', l: [10, 14, 17] },
    // Service Discovery
    { t: 'SOME/IP-SD message', also: ['SD message', 'SOME/IP-SD'], m: 'A SOME/IP message of the Service Discovery service (Service ID 0xFFFF, Method ID 0x8100). It carries entries and options.', l: [11, 30] },
    { t: 'entry', also: ['entries'], m: 'One statement inside an SD message, such as an OfferService or a SubscribeEventgroup. One SD message can carry many entries.', l: [11, 30] },
    { t: 'option', also: ['options'], m: 'Additional information an SD entry points to, such as an Endpoint option or a Multicast option.', l: [11, 30] },
    { t: 'Endpoint option', also: ['Endpoint options'], m: 'Part of an SD message that carries an IP address, a port and UDP or TCP: where to reach a service, or where to send its events.', l: [11, 14] },
    { t: 'Multicast option', m: 'An option in the SubscribeEventgroupAck that names the group address and port the client must listen on when the events are sent by multicast.', l: [11, 14, 15] },
    { t: 'OfferService', also: ['offer', 'offers'], m: 'SD entry from the server: "this service instance is available here, for TTL seconds". Sent by multicast and repeated, so it must be renewed.', l: [11] },
    { t: 'StopOfferService', m: 'An OfferService entry with TTL 0: the service instance is no longer available.', l: [11] },
    { t: 'TTL', also: ['time to live'], m: 'Time to live: how many seconds an offer or a subscription stays valid unless it is renewed. TTL 0 means stop.', l: [11, 14] },
    { t: 'multicast', m: 'Sent once to a group address; every ECU that listens on that group receives it.', l: [11, 15] },
    { t: 'unicast', m: 'Sent to one ECU only, at its own IP address.', l: [11, 15] },
    { t: 'soft state', m: 'State that disappears by itself when it is not renewed in time. Offers and subscriptions are soft state: each has a TTL.', l: [11, 14] },
    { t: 'Initial Wait Phase', m: 'First start phase of Sd: a random wait between INITIAL_DELAY_MIN and INITIAL_DELAY_MAX before the first OfferService or FindService.', l: [12] },
    { t: 'Repetition Phase', m: 'Second start phase of Sd: up to REPETITIONS_MAX repetitions with a gap that doubles each time, starting at REPETITIONS_BASE_DELAY.', l: [12, 13] },
    { t: 'Main Phase', m: 'The last start phase of Sd: the server repeats its OfferService every CYCLIC_OFFER_DELAY for as long as the service is up. A client sends no more FindService.', l: [12] },
    { t: 'INITIAL_DELAY_MIN', also: ['INITIAL_DELAY_MAX'], m: 'Lower and upper bounds of the random wait in the Initial Wait Phase.', l: [12] },
    { t: 'REPETITIONS_BASE_DELAY', m: 'The first gap of the Repetition Phase; each following gap is twice the one before.', l: [12] },
    { t: 'REPETITIONS_MAX', m: 'How many messages the Repetition Phase sends; 0 skips the phase.', l: [12] },
    { t: 'CYCLIC_OFFER_DELAY', m: 'The period of the OfferService in the Main Phase; 0 means no cyclic offers.', l: [12] },
    { t: 'REQUEST_RESPONSE_DELAY', m: 'A random wait (between a min and a max) before answering a multicast FindService, so many servers do not answer at once.', l: [12, 13] },
    { t: 'FindService', m: 'SD entry from the client: "who offers this service?". Sent by multicast in the Initial Wait and Repetition Phase only; any OfferService ends the search.', l: [13] },
    { t: 'REQUESTED', also: ['RELEASED'], m: 'State given by BswM: a client service is wanted (REQUESTED) or not (RELEASED). On the server, an event handler is REQUESTED while it has subscribers.', l: [13, 17] },
    { t: 'SubscribeEventgroup', also: ['Subscribe'], m: 'SD entry from the client: "please send me the events of this eventgroup, for TTL seconds, to these endpoints". Always unicast.', l: [14] },
    { t: 'SubscribeEventgroupAck', also: ['Ack'], m: 'SD entry from the server: the subscription is accepted, for the TTL it repeats. Always unicast.', l: [14] },
    { t: 'SubscribeEventgroupNack', also: ['Nack'], m: 'SD entry from the server: the subscription is refused. It is the Ack entry with TTL 0. Always unicast.', l: [14] },
    { t: 'StopSubscribeEventgroup', m: 'A SubscribeEventgroup entry with TTL 0: "I no longer want the events of this eventgroup". It gets no answer.', l: [14] },
    { t: 'initial event', also: ['initial events'], m: 'The current value of a field, sent once to a new subscriber right after the SubscribeEventgroupAck, so the client does not wait for the next change.', l: [8, 14] },
    { t: 'Initial Data Requested flag', also: ['Initial Data Requested'], m: 'A flag in the SubscribeEventgroup entry: "please send me the initial events of the fields in this eventgroup".', l: [14, 30] },
    { t: 'Subscribe retry', m: 'Optional: if neither Ack nor Nack arrives within SUBSCRIBE_RETRY_DELAY, the client sends the SubscribeEventgroup again, up to SUBSCRIBE_RETRY_MAX times, without waiting for the next offer.', l: [14] },
    { t: 'multicast threshold', m: 'The number of subscribers from which the server sends the events of an eventgroup by multicast instead of one unicast copy per client.', l: [15] },
    { t: 'reboot flag', m: 'Flag in the SD header: set after a restart until the Session ID wraps around for the first time.', l: [16, 30] },
    { t: 'reboot detection', m: 'Noticing that a partner restarted: its reboot flag goes from 0 to 1, or its SD Session ID goes backwards while the flag is 1. All its offers and subscriptions are then dropped.', l: [16] },
    { t: 'service group', also: ['SdServiceGroup'], m: 'Sd configuration that groups several service instances so BswM can request or release them together.', l: [17] },
    { t: 'AVAILABLE', also: ['DOWN'], m: 'State of a service: BswM sets a server service AVAILABLE (offer it) or DOWN (stop offering). Sd reports a client service AVAILABLE once it is offered, and a consumed eventgroup once the SubscribeEventgroupAck arrived; DOWN otherwise.', l: [17] },
    // The data path
    { t: 'main function', m: 'The cyclic function of a module, called by the scheduler at a fixed period, that does its timed work.', l: [18] },
    { t: 'TxConfirmation', m: 'The callback that tells the module above that a PDU has been sent.', l: [18] },
    { t: 'MAC address', m: 'The hardware address of an Ethernet controller; frames are addressed by MAC address.', l: [18] },
    { t: 'VLAN tag', m: 'Four bytes in the Ethernet frame that put it into a virtual LAN; EthIf maps VLANs to its controllers.', l: [18, 19] },
    { t: 'socket connection', m: 'In SoAd: one local socket plus one remote address and port. Each PDU route goes through socket connections.', l: [18, 21] },
    { t: 'socket connection group', m: 'In SoAd: socket connections that share one local port and protocol (UDP or TCP).', l: [21] },
    { t: 'SoAd PDU header', also: ['PDU header'], m: 'Optional header ID and length that SoAd puts in front of each PDU. For SOME/IP the SOME/IP header itself is used as the PDU header.', l: [18, 20] },
    { t: 'header ID', also: ['SoAdTxPduHeaderId', 'SoAdRxPduHeaderId'], m: 'The 32-bit ID in the SoAd PDU header; for SOME/IP it is the Message ID, which lets SoAd pick the route on reception.', l: [20, 27] },
    { t: 'frame owner', m: 'The upper module EthIf hands a received Ethernet frame to, chosen by the frame type (for example TcpIp for IPv4).', l: [19] },
    { t: 'message acceptance filter', m: 'SoAd check on reception: a message is only accepted from the remote address that the socket connection allows.', l: [19] },
    { t: 'routing group', m: 'In SoAd: a set of routes (PDU routes for transmission, socket routes for reception) that is enabled or disabled as a whole. Sd turns routing groups on and off, so events go only to subscribers and are accepted only after a subscription.', l: [19, 21] },
    { t: 'triggering routing group', also: ['trigger transmit'], m: 'A routing group that makes SoAd send its PDUs at once (used for initial events) by asking the upper module for the data.', l: [21] },
    { t: 'wildcard remote address', m: 'A socket connection whose remote address is not yet known (any address); Sd fills it in when a partner shows up.', l: [21] },
    { t: 'PDU meta data', m: 'Extra data that travels with a PDU, here the socket connection ID, so the same PDU can be sent to different partners.', l: [21] },
    { t: 'UDP', m: 'Connectionless transport: fast and lean, but a lost datagram is not repeated. SOME/IP reliability "maybe".', l: [22] },
    { t: 'TCP', m: 'Connection-oriented transport: lost data is repeated and order is kept, at the cost of delay. SOME/IP reliability "exactly once".', l: [22] },
    { t: 'More Segments flag', m: 'Bit in the SOME/IP TP header: 1 if more segments follow, 0 in the last segment.', l: [23, 32] },
    { t: 'TP flag', m: 'Bit 0x20 in the Message Type: this message is a segment and carries a SOME/IP TP header.', l: [23, 32] },
    { t: 'Offset', m: 'Field of the SOME/IP TP header: where this segment starts in the original payload, in units of 16 bytes.', l: [23, 32] },
    { t: 'transformer chain', m: 'The transformers the RTE runs one after the other on the data of one communication, for example SOME/IP then E2E.', l: [24] },
    { t: 'UINT8_N', also: ['UINT8_DYN'], m: 'COM signal types for byte arrays of fixed (UINT8_N) or dynamic (UINT8_DYN) length; a whole serialized SOME/IP message travels as one.', l: [18, 24] },
    // Added while converting the lessons (configuration, low-level and state machine terms included)
    { t: 'ClientServerOperation', also: ['client-server operation'], m: 'A function of a client-server interface, with IN, INOUT and OUT arguments, that one SWC provides and another calls through the RTE. Over SOME/IP it becomes a method.', l: [6] },
    { t: 'data element', also: ['VariableDataPrototype'], m: 'One value that a sender-receiver interface carries.', l: [7, 8] },
    { t: 'sender-receiver interface', also: ['SenderReceiverInterface'], m: 'An interface over which one SWC sends data elements and others receive them. Events, field notifiers and fire&forget methods with arguments are described with it.', l: [7, 8] },
    { t: 'trigger interface', also: ['TriggerInterface'], m: 'An interface that carries triggers: signals without data. A fire&forget method without arguments is described with it.', l: [7] },
    { t: 'E_NOT_REACHABLE', m: 'Return Code 0x05: the system that runs the service is not reachable. Used only inside the client, never sent on the wire.', l: [9] },
    { t: 'communication relation', m: 'One sender and one receiver of SD messages. Session ID and reboot flag are judged per relation, separately for multicast and unicast.', l: [16] },
    { t: 'RxIndication', m: 'The callback that tells the module above that a PDU has been received, and hands it the data.', l: [19] },
    { t: 'socket route', m: 'In SoAd: the way of a received message from a socket connection up to a module, chosen by its header ID.', l: [19, 21] },
    { t: 'PDU route', m: 'In SoAd: the way of a PDU from PduR out to one or more socket connections. Routing groups switch it on and off.', l: [21] },
    { t: 'Magic Cookie', also: ['Magic Cookie message', 'Magic Cookies'], m: 'A fixed SOME/IP message a sender may insert into a TCP stream now and then, so receivers and test tools can find the message boundaries again.', l: [22, 28] },
    { t: 'Nagle\'s algorithm', also: ['TCP_NODELAY'], m: 'TCP collecting small writes before sending them together. SOME/IP recommends switching it off to keep reaction times short.', l: [22] },
    { t: 'SOME/IP TP header', also: ['SOME/IP-TP header', 'TP header'], m: 'The 4 bytes that SOME/IP TP puts after the SOME/IP header of every segment: the Offset and the More Segments flag.', l: [23, 32] },
    { t: 'COM Based Transformer', m: 'An alternative first transformer in the transformer chain that lays data out exactly like COM signals. It cannot be used for methods.', l: [24] },
    { t: 'E2E transformer', also: ['E2E'], m: 'Transformer for end-to-end protection: it adds an E2E header with a check value and a counter, so the receiver can detect corrupted, lost or repeated data.', l: [24] },
    { t: 'ApplicationEndpoint', m: 'System description element for the local UDP or TCP port of a service instance, together with its IP address (NetworkEndpoint).', l: [25] },
    { t: 'ConsumedEventGroup', m: 'System description element for an eventgroup a ConsumedServiceInstance subscribes to; it becomes an SdConsumedEventGroup.', l: [25] },
    { t: 'ConsumedServiceInstance', m: 'System description element for a service instance an ECU uses; it becomes an SdClientService in the ECU configuration.', l: [25] },
    { t: 'ECU configuration', also: ['ECUC'], m: 'The containers and parameters that the basic software modules of one ECU read: its share of the system description plus local choices.', l: [25] },
    { t: 'ECU extract', m: 'The part of the system description that concerns one ECU; the configuration tools derive that ECU\'s configuration from it.', l: [25] },
    { t: 'EventHandler', m: 'System description element for the server side of an eventgroup in a ProvidedServiceInstance; it becomes an SdEventHandler.', l: [25] },
    { t: 'PduActivationRoutingGroup', m: 'System description element for a routing group: the PDUs it enables and, for events, its eventGroupControlType. It becomes a SoAd routing group.', l: [25] },
    { t: 'ProvidedServiceInstance', m: 'System description element for a service instance an ECU offers; it becomes an SdServerService in the ECU configuration.', l: [25] },
    { t: 'SoConIPduIdentifier', m: 'System description element that binds a PDU to a socket and gives its header ID.', l: [25] },
    { t: 'SOMEIPTransformationDescription', m: 'System description settings of the SOME/IP transformer shared by all signals: byte order, alignment, interface version.', l: [25] },
    { t: 'SOMEIPTransformationISignalProps', m: 'System description settings of the SOME/IP transformer for one signal: message type, session handling, size of length fields.', l: [25] },
    { t: 'system description', also: ['System Template'], m: 'The model of the whole vehicle network, written with the AUTOSAR System Template: services, service instances, PDUs, header IDs, Sd timing and addresses, shared by all ECUs.', l: [25] },
    { t: 'HandleId', also: ['handle ID', 'handle IDs'], m: 'The number BswM uses to request a service instance, eventgroup or service group and to read its state (SdServerServiceHandleId and the like).', l: [26] },
    { t: 'SdClientTimer', m: 'Sd configuration container with the SD timing of a client: initial delay, repetitions, TTL, request-response delay and Subscribe retry.', l: [26] },
    { t: 'SdConsumedMethods', m: 'Sd configuration container for the methods of a client service: the routing group Sd enables while the service instance is AVAILABLE.', l: [26] },
    { t: 'SdEventActivationRef', m: 'Reference from an SdEventHandler to the routing group Sd enables per socket connection for each subscriber.', l: [26] },
    { t: 'SdEventTriggeringRef', m: 'Reference from an SdEventHandler to the routing group Sd triggers once to send the initial events to a new subscriber.', l: [26] },
    { t: 'SdInstance', m: 'Sd configuration container for one link or VLAN, with its three PDUs for SD messages (one Tx, a unicast Rx and a multicast Rx).', l: [26] },
    { t: 'SdMainFunctionCycleTime', m: 'Period of the Sd main function, in seconds; all Sd timing runs in steps of it.', l: [26] },
    { t: 'SdProvidedMethods', m: 'Sd configuration container for the methods of a server service: the routing group Sd enables while the service instance is offered.', l: [26] },
    { t: 'SdServerTimer', m: 'Sd configuration container with the SD timing of a server: initial delay, repetitions, cyclic offer delay, TTL and request-response delay.', l: [26] },
    { t: 'ComIPdu', m: 'COM configuration container for one I-PDU; for SOME/IP it holds one byte-array signal.', l: [27] },
    { t: 'EthIfController', m: 'EthIf configuration container for an Ethernet controller as TcpIp sees it, with its optional VLAN (EthIfVlanId).', l: [27] },
    { t: 'global PDU', also: ['EcuC Pdu'], m: 'The EcuC Pdu container: the ECU-wide name of one PDU that COM, PduR, SOME/IP TP and SoAd all reference, so they mean the same PDU.', l: [27] },
    { t: 'LdComIPdu', m: 'LdCom configuration container for one I-PDU with one byte-array signal.', l: [27] },
    { t: 'N-PDU', m: 'In SOME/IP TP: the PDU that carries one segment.', l: [27] },
    { t: 'N-SDU', m: 'In SOME/IP TP: the whole message, before segmentation or after reassembly.', l: [27] },
    { t: 'PduRDestPdu', m: 'PduR configuration container for a PDU that PduR forwards to a module (the destination of a routing path).', l: [27] },
    { t: 'PduRRoutingPath', m: 'PduR configuration container for one route through PduR, from one PduRSrcPdu to one PduRDestPdu.', l: [27] },
    { t: 'PduRSrcPdu', m: 'PduR configuration container for a PDU that PduR receives from a module (the source of a routing path).', l: [27] },
    { t: 'SoAdPduHeaderEnable', m: 'SoAd parameter that switches the SoAd PDU header on for a socket connection group; needed for SOME/IP.', l: [27] },
    { t: 'SoAdPduRoute', m: 'SoAd configuration container for the transmit route of one PDU coming from above.', l: [27] },
    { t: 'SoAdPduRouteDest', m: 'One way out of a SoAdPduRoute: header ID, routing groups and the socket connection or socket connection group.', l: [27] },
    { t: 'SoAdSocketRemoteAddress', m: 'SoAd configuration container with the remote IP address and port of a socket connection; may be a wildcard.', l: [27] },
    { t: 'SoAdSocketRoute', m: 'SoAd configuration container for a receive route: from a socket connection up to a module, selected by the header ID.', l: [27] },
    { t: 'SoAdSocketRouteDest', m: 'The destination of a SoAdSocketRoute: the PDU handed up, with its routing groups.', l: [27] },
    { t: 'TcpIpLocalAddr', m: 'TcpIp configuration container for one local IP address of the ECU.', l: [27] },
    { t: 'big-endian', also: ['network byte order'], m: 'Byte order with the most significant byte first. The SOME/IP header, length fields and union type fields are always big-endian.', l: [28] },
    { t: 'alignment', m: 'Rule that the data after a variable-length element starts at a multiple of a set size (8 to 256 bits), counted from the start of the SOME/IP message.', l: [29] },
    { t: 'BOM', also: ['byte order mark'], m: 'Byte order mark: the bytes at the start of every SOME/IP string that name its encoding, for UTF-8 EF BB BF.', l: [29] },
    { t: 'byteOrder', m: 'Configured byte order of the payload in the SOME/IP transformation description: mostSignificantByteFirst, mostSignificantByteLast or opaque.', l: [29] },
    { t: 'Data ID', m: '12 bits of the TLV tag that number the member. A receiver skips members whose Data ID it does not know.', l: [29] },
    { t: 'implementsLegacyStringSerialization', also: ['legacy string serialization'], m: 'Legacy Classic Platform option: strings are sent without BOM and terminator. The specification plans to remove it.', l: [29] },
    { t: 'length field', m: 'A field in front of a struct, string, array or union that says how many bytes follow. It never counts itself and is always big-endian.', l: [29] },
    { t: 'little-endian', m: 'Byte order with the least significant byte first. Possible for the payload, never for the SOME/IP header.', l: [29] },
    { t: 'padding', m: 'Filler bytes with undefined value, added for alignment; in a union, the bytes after the data that the length field still covers.', l: [29] },
    { t: 'TLV', also: ['TLV serialization', 'tag'], m: 'Tag, length, value: serialization of a struct with a 2-byte tag in front of every member, so members can be added or left out.', l: [29] },
    { t: 'wire type', m: '3 bits of the TLV tag that say how the size of the member is coded: a fixed size or a length field.', l: [29] },
    { t: 'Configuration option', m: 'SD option 0x01: name=value strings with extra configuration for a service.', l: [30] },
    { t: 'Counter', m: '4 bits of an eventgroup entry that tell apart subscriptions of one client to the same eventgroup; 0 if unused.', l: [30] },
    { t: 'Discardable flag', m: 'Top bit of the fourth byte of an SD option: a receiver that does not know the option may ignore it.', l: [30] },
    { t: 'eventgroup entry', also: ['Type 2 entry'], m: 'The entry format (Type 2) of SubscribeEventgroup and its Ack or Nack: 16 bytes ending with the Initial Data Requested flag, the Counter and the Eventgroup ID.', l: [30] },
    { t: 'Explicit Initial Data Control flag', m: 'Bit 0x20 of the Flags byte of a SOME/IP-SD message: the sender honours the Initial Data Requested flag. Always 1.', l: [30] },
    { t: 'Load Balancing option', m: 'SD option 0x02: priority and weight that help a client choose between several instances of a service.', l: [30] },
    { t: 'option run', also: ['Index 1st options', 'Index 2nd options'], m: 'The options an entry uses: a start index into the options array and a number of options. Every entry has two option runs.', l: [30] },
    { t: 'SD Endpoint option', m: 'SD option 0x24 (IPv6: 0x26): the address and port of the sender\'s Sd. It is the first option and never referenced by an entry.', l: [30] },
    { t: 'service entry', also: ['Type 1 entry'], m: 'The entry format (Type 1) of FindService and OfferService: 16 bytes ending with the Minor Version.', l: [30] },
    { t: 'Unicast flag', m: 'Bit 0x40 of the Flags byte of a SOME/IP-SD message: the sender can receive unicast SD messages. Always 1.', l: [30] },
    { t: 'enableTxRoutingGroup', also: ['disableTxRoutingGroup'], m: 'Actions of the server eventgroup state machines: start or stop sending the events of the eventgroup by turning its routing group on or off.', l: [31] },
    { t: 'ifstatus', also: ['up_and_configured'], m: 'The state of the network interface in the SD state machines: up_and_configured when the link is up and the IP address is assigned.', l: [31] },
    { t: 'Not Ready', also: ['Ready'], m: 'The two top states of the SD server state machine: the service instance is not offered (Not Ready) or offered (Ready, with the Initial Wait, Repetition and Main Phase inside).', l: [31] },
    { t: 'Not Requested', m: 'State group of the SD client state machine: BswM has not requested the service instance, but offers are still noted.', l: [31] },
    { t: 'Not Subscribed', also: ['Subscribed'], m: 'States of the server eventgroup state machine inside Service Up: no subscriber, or at least one.', l: [31] },
    { t: 'Requested_but_not_ready', m: 'Client state: the service instance is REQUESTED, but ifstatus is not up_and_configured.', l: [31] },
    { t: 'Searching for Service', m: 'State group of the SD client state machine: the Initial Wait and Repetition Phase, in which the client sends FindService.', l: [31] },
    { t: 'Service Down', also: ['Service Up'], m: 'Top states of the server eventgroup state machine: the service instance is not offered (Service Down) or offered (Service Up).', l: [31] },
    { t: 'Service Not Seen', also: ['Service Seen'], m: 'Client states inside Not Requested: no valid OfferService is known (Not Seen), or one is known and its TTL is running (Seen).', l: [31] },
    { t: 'Service Ready', also: ['Stopped'], m: 'Client states in the Main Phase: the service instance is offered and used (Service Ready), or the server sent StopOfferService and the client waits without FindService (Stopped).', l: [31] },
    { t: 'service-status', m: 'Input of the SD server state machine: up when BswM has set the server service instance to AVAILABLE, down when set to DOWN.', l: [31] },
    { t: 'SubscriptionCounter', m: 'Number of current subscribers of an eventgroup in the server eventgroup state machine.', l: [31] },
    { t: 'UnicastLimit', m: 'Multicast threshold minus one: up to this many subscribers the events of an eventgroup go by unicast.', l: [31] }
  ];

  const index = new Map();
  TERMS.forEach((e) => [e.t].concat(e.also || []).forEach((k) => index.set(k.toLowerCase(), e)));
  function find(key) {
    const k = String(key).trim().toLowerCase().replace(/\s+/g, ' ');
    return index.get(k) || (k.endsWith('s') ? index.get(k.slice(0, -1)) : undefined);
  }

  window.Glossary = { TERMS, find };

  const marks = document.querySelectorAll('.term');
  if (!marks.length) return;

  const tip = document.createElement('div');
  tip.className = 'term-tip';
  tip.id = 'term-tip';
  tip.setAttribute('role', 'tooltip');
  tip.hidden = true;
  document.body.appendChild(tip);
  let owner = null;

  function show(el) {
    const e = find(el.dataset.term || el.textContent);
    owner = el;
    tip.innerHTML = '';
    const b = document.createElement('b');
    b.textContent = e.t;
    const p = document.createElement('span');
    p.textContent = ' ' + e.m;
    tip.append(b, p);
    tip.hidden = false;
    el.setAttribute('aria-describedby', 'term-tip');
    const r = el.getBoundingClientRect();
    const w = tip.offsetWidth;
    const left = Math.max(8, Math.min(r.left, document.documentElement.clientWidth - w - 8));
    tip.style.left = (left + window.scrollX) + 'px';
    tip.style.top = (r.bottom + window.scrollY + 6) + 'px';
  }
  function hide() {
    if (owner) owner.removeAttribute('aria-describedby');
    owner = null;
    tip.hidden = true;
  }

  marks.forEach((el) => {
    if (!find(el.dataset.term || el.textContent)) {
      console.warn('Glossary: no entry for "' + (el.dataset.term || el.textContent) + '"');
      el.classList.remove('term');
      return;
    }
    el.tabIndex = 0;
    el.addEventListener('mouseenter', () => show(el));
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', () => show(el));
    el.addEventListener('blur', hide);
    el.addEventListener('click', (ev) => { ev.stopPropagation(); if (owner === el) hide(); else show(el); });
  });
  document.addEventListener('click', hide);
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') hide(); });
  window.addEventListener('resize', hide);
})();
