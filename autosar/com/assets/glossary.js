/*
 * The course glossary: one list of AUTOSAR terms with a one-line meaning. It feeds
 *   - the hover help on every page: <code class="term">ComTransferProperty</code> or <span class="term">I-PDU group</span>
 *     shows the meaning on hover, focus or tap. The text is looked up (case does not matter,
 *     a trailing plural "s" is ignored); data-term="..." looks up another key instead.
 *   - reference/words.html, which lists every entry.
 * A term marked in a page but missing here is reported in the console.
 * Each entry: t = term, also = other spellings that find it, m = meaning, l = lessons that teach it.
 */
(function () {
  const TERMS = [
    // The big picture
    { t: 'COM', also: ['AUTOSAR COM', 'Communication module'], m: 'The Communication module of the Classic Platform: it packs signals from the RTE into I-PDUs, decides when they are sent, and unpacks received I-PDUs into signals again.', l: [1] },
    { t: 'ECU', also: ['Electronic Control Unit'], m: 'Electronic Control Unit: one of the computers in a vehicle. ECUs exchange signals over buses such as CAN and Ethernet.', l: [1] },
    { t: 'bus', m: 'The shared network that connects ECUs, for example CAN or Ethernet.', l: [1] },
    { t: 'CAN', m: 'Controller Area Network: the most common vehicle bus; it carries frames of up to 8 bytes (64 bytes with CAN FD).', l: [1] },
    { t: 'Ethernet', m: 'The IP-based vehicle network; I-PDUs travel in UDP or TCP messages.', l: [1] },
    { t: 'SWC', also: ['software component'], m: 'Software component: application software above the RTE that writes and reads signals.', l: [1] },
    { t: 'RTE', also: ['Runtime Environment'], m: 'Runtime Environment: the layer between the SWCs and the basic software; it calls COM to send and receive signals.', l: [1] },
    { t: 'signal', m: 'One value with a meaning, for example the vehicle speed. It occupies a fixed range of bits in an I-PDU.', l: [1] },
    { t: 'I-PDU', also: ['PDU', 'Interaction Layer PDU'], m: 'Interaction Layer Protocol Data Unit: a block of bytes that holds several signals side by side. COM sends and receives whole I-PDUs.', l: [1] },
    { t: 'PduR', also: ['PDU Router'], m: 'PDU Router: the module below COM; it forwards I-PDUs between COM and the bus interfaces and transport protocols.', l: [1, 14] },
    // Transmission
    { t: 'transfer property', also: ['ComTransferProperty'], m: 'Setting of a signal: whether writing it makes its I-PDU go out (TRIGGERED and its variants) or not (PENDING).', l: [2] },
    { t: 'TRIGGERED', m: 'Transfer property: every write of the signal makes its I-PDU go out (when the transmission mode is DIRECT or MIXED), with repetitions if configured.', l: [2, 3] },
    { t: 'PENDING', m: 'Transfer property: writing the signal does not send anything; the new value goes out with the next transmission of its I-PDU.', l: [2] },
    { t: 'transmission mode', also: ['ComTxMode', 'ComTxModeMode'], m: 'Setting of an I-PDU: when it is sent. DIRECT (on a triggered write), PERIODIC (on a timer), MIXED (both) or NONE (neither).', l: [2] },
    { t: 'DIRECT', m: 'Transmission mode: the I-PDU is sent only when a triggered signal is written (plus repetitions).', l: [2] },
    { t: 'PERIODIC', m: 'Transmission mode: the I-PDU is sent at a fixed period, and writes do not trigger a transmission.', l: [2] },
    { t: 'MIXED', m: 'Transmission mode: the I-PDU is sent periodically and also when a triggered signal is written.', l: [2] },
    { t: 'NONE', m: 'Transmission mode: COM never starts a transmission of the I-PDU by itself. As a reception timeout action (ComRxDataTimeoutAction): the signal keeps its last received value.', l: [2, 6] },
    { t: 'signal processing', also: ['ComIPduSignalProcessing'], m: 'Setting of an I-PDU: whether COM processes a received I-PDU and makes its notifications (including transmission confirmations) at once (IMMEDIATE) or in the next main function (DEFERRED).', l: [2] },
    { t: 'IMMEDIATE', m: 'Signal processing: COM processes a received I-PDU and notifies the RTE right away, when it arrives.', l: [2] },
    { t: 'DEFERRED', m: 'Signal processing: COM keeps a received I-PDU and processes and notifies it in its next Com_MainFunctionRx.', l: [2] },
    { t: 'main function', also: ['Com_MainFunctionRx', 'Com_MainFunctionTx', 'Com_MainFunctionRouteSignals'], m: 'The functions of COM that the scheduler calls at a fixed period: Com_MainFunctionTx for transmission timing, Com_MainFunctionRx for deferred reception and timeouts, Com_MainFunctionRouteSignals for the signal gateway.', l: [2] },
    { t: 'number of repetitions', also: ['repetition', 'ComTxModeNumberOfRepetitions', 'N-Times transmission'], m: 'How many extra transmissions follow a triggered transmission of an I-PDU (N-Times transmission). With 2, the I-PDU goes out three times.', l: [3] },
    { t: 'repetition period', also: ['ComTxModeRepetitionPeriod'], m: 'The time between the repetitions of an I-PDU.', l: [3] },
    { t: 'minimum delay time', also: ['MDT', 'ComMinimumDelayTime', 'minimum delay timer'], m: 'The shortest time between two transmissions of the same I-PDU. A transmission that falls inside it is delayed, not lost.', l: [3] },
    { t: 'TRIGGERED_ON_CHANGE', m: 'Transfer property: only a write with a value different from the last one makes the I-PDU go out, with repetitions.', l: [3] },
    { t: 'TRIGGERED_WITHOUT_REPETITION', m: 'Transfer property: every write makes the I-PDU go out once, without repetitions.', l: [3] },
    { t: 'TRIGGERED_ON_CHANGE_WITHOUT_REPETITION', m: 'Transfer property: only a changed value makes the I-PDU go out, once, without repetitions.', l: [3] },
    { t: 'transmission mode selector', also: ['TMS'], m: 'The result that picks the transmission mode of an I-PDU: TRUE selects ComTxModeTrue, FALSE selects ComTxModeFalse. It is TRUE if at least one transmission mode condition is true.', l: [4] },
    { t: 'transmission mode condition', also: ['TMC'], m: 'A filter on one signal of an I-PDU whose result (true or false) feeds the transmission mode selector.', l: [4] },
    { t: 'ComTxModeTrue', also: ['ComTxModeFalse'], m: 'The two containers with the transmission mode settings of an I-PDU; the transmission mode selector picks one of them.', l: [15] },
    // Reception
    { t: 'init value', also: ['ComSignalInitValue'], m: 'The value a signal has from start-up until a real value is received or written.', l: [5] },
    { t: 'update-bit', also: ['update bit', 'ComUpdateBitPosition'], m: 'One bit in an I-PDU next to a signal or signal group: set by the sender when the value was written, checked by the receiver, which ignores the value if the bit is not set.', l: [5] },
    { t: 'deadline monitoring', m: 'COM watching time: reception deadline monitoring notices that an I-PDU did not arrive in time; transmission deadline monitoring notices that a transmission was not confirmed in time.', l: [6] },
    { t: 'reception deadline monitoring', m: 'Detecting that a received signal or signal group did not arrive within its timeout.', l: [6] },
    { t: 'transmission deadline monitoring', m: 'Detecting that the lower layers did not confirm a transmission within its timeout.', l: [6] },
    { t: 'timeout', also: ['ComTimeout'], m: 'The time allowed before deadline monitoring reports a missing reception or confirmation.', l: [6] },
    { t: 'first timeout', also: ['ComFirstTimeout'], m: 'The timeout used for the very first reception after start-up or after the I-PDU group was started.', l: [6] },
    { t: 'data invalid value', also: ['ComSignalDataInvalidValue', 'invalid value'], m: 'A configured value of a signal that means "no valid value available". The sender sets it with Com_InvalidateSignal.', l: [7] },
    { t: 'Com_InvalidateSignal', also: ['Com_InvalidateSignalGroup'], m: 'COM API: writes the data invalid value into a signal (or each group signal of a signal group) for transmission.', l: [7] },
    { t: 'ComDataInvalidAction', also: ['data invalid action'], m: 'What a receiver does with a data invalid value: NOTIFY (call the invalid notification) or REPLACE (use the init value instead).', l: [7] },
    { t: 'filter', also: ['ComFilter', 'ComFilterAlgorithm', 'filter algorithm'], m: 'A rule on a signal value with the result pass or block. In reception it decides whether the RTE gets the new value; in transmission it feeds a transmission mode condition.', l: [8] },
    // Notifications
    { t: 'notification', also: ['callback'], m: 'A function of the RTE that COM calls when something happens to a signal or signal group: received, timed out, invalid, transmitted, or transmission failed.', l: [9] },
    { t: 'Com_SendSignal', m: 'COM API with which the RTE writes a signal value for transmission.', l: [9] },
    { t: 'Com_ReceiveSignal', m: 'COM API with which the RTE reads the current value of a received signal.', l: [9] },
    // Signal groups, I-PDU groups and the gateway
    { t: 'signal group', m: 'A set of signals (group signals) that must be sent and received consistently, as one matching set.', l: [10] },
    { t: 'group signal', m: 'One signal inside a signal group.', l: [10] },
    { t: 'shadow buffer', m: 'A copy of a signal group where its group signals are collected or read, so the I-PDU always holds a consistent set.', l: [10] },
    { t: 'Com_SendSignalGroup', also: ['Com_ReceiveSignalGroup'], m: 'COM APIs that copy a whole signal group from the shadow buffer into the I-PDU (send) or from the I-PDU into the shadow buffer (receive) in one step.', l: [10] },
    { t: 'I-PDU group', also: ['ComIPduGroup'], m: 'A set of I-PDUs that is started and stopped together, for example all I-PDUs of one bus.', l: [11] },
    { t: 'Com_IpduGroupStart', also: ['Com_IpduGroupStop'], m: 'COM APIs that start or stop an I-PDU group. Com_IpduGroupStart has a parameter Initialize: true sets the I-PDUs back to their init values. In an AUTOSAR ECU, BswM calls them.', l: [11] },
    { t: 'BswM', also: ['BSW Mode Manager'], m: 'BSW Mode Manager: decides on mode changes of the ECU and starts and stops I-PDU groups in COM.', l: [11] },
    { t: 'signal gateway', also: ['gateway'], m: 'COM feature that copies a received signal or signal group into an I-PDU to be transmitted, without any SWC in between.', l: [12] },
    { t: 'ComGwMapping', m: 'Configuration container of the signal gateway: one source signal and one or more destination signals.', l: [12] },
    { t: 'large I-PDU', m: 'An I-PDU that does not fit into one frame of the bus. COM hands it to a transport protocol, which sends it in several frames.', l: [13] },
    { t: 'transport protocol', also: ['TP'], m: 'A module below the PduR (for example CanTp) that cuts a large I-PDU into frames and joins them again on reception.', l: [13] },
    { t: 'dynamic length signal', also: ['UINT8_DYN'], m: 'A signal of type UINT8_DYN: a byte array whose length can change from one transmission to the next. It must be the last signal in its I-PDU.', l: [13] },
    { t: 'Com_SendDynSignal', also: ['Com_ReceiveDynSignal'], m: 'COM APIs to write or read a dynamic length signal together with its current length.', l: [13] },
    // Below COM
    { t: 'L-PDU', also: ['frame'], m: 'Data Link Layer PDU: what the bus carries in one frame. The bus interface (for example CanIf) handles L-PDUs.', l: [14] },
    { t: 'CanIf', also: ['CAN Interface'], m: 'CAN Interface: hands L-PDUs between the PduR (or CanTp) and the CAN driver.', l: [14] },
    { t: 'SoAd', also: ['Socket Adaptor'], m: 'Socket Adaptor: maps I-PDUs to UDP or TCP socket connections of TcpIp.', l: [14] },
    { t: 'Com_RxIndication', m: 'COM callback: the PduR hands COM a received I-PDU.', l: [14] },
    { t: 'Com_TxConfirmation', m: 'COM callback: the PduR reports that an I-PDU was transmitted.', l: [14] },
    { t: 'Com_TriggerTransmit', m: 'COM callback: a lower layer asks COM for the current content of an I-PDU just before it is sent.', l: [14] },
    { t: 'PduR_ComTransmit', m: 'PduR API with which COM requests the transmission of an I-PDU.', l: [14] },
    // Configuration and bits
    { t: 'container', m: 'A named group of configuration parameters in the ECU configuration, for example ComIPdu or ComSignal. Containers can hold other containers.', l: [15] },
    { t: 'parameter', also: ['configuration parameter'], m: 'One configurable setting inside a container, for example ComTransferProperty.', l: [15] },
    { t: 'ComIPdu', m: 'Configuration container of one I-PDU: direction, signal processing, transmission modes, I-PDU groups and its signals.', l: [15] },
    { t: 'ComSignal', m: 'Configuration container of one signal: position, size, type, transfer property, init value, filter, timeouts and notifications.', l: [15] },
    { t: 'ComBitPosition', m: 'Parameter: where a signal starts in its I-PDU, counted in bits (the LSB for little endian, the MSB for big endian).', l: [16] },
    { t: 'ComBitSize', m: 'Parameter: how many bits a signal occupies in its I-PDU.', l: [16] },
    { t: 'endianness', also: ['ComSignalEndianness', 'byte order'], m: 'The byte order of a signal: LITTLE_ENDIAN (least significant byte first), BIG_ENDIAN (most significant byte first) or OPAQUE (bytes copied as they are).', l: [16] },
    { t: 'LITTLE_ENDIAN', m: 'Byte order: the least significant byte comes first (Intel order).', l: [16] },
    { t: 'BIG_ENDIAN', m: 'Byte order: the most significant byte comes first (Motorola order).', l: [16] },
    { t: 'OPAQUE', m: 'Byte order of byte arrays: COM copies the bytes as they are, without reordering.', l: [16] },
    { t: 'LSB', also: ['least significant bit'], m: 'Least significant bit: the bit with the smallest value.', l: [16] },
    { t: 'MSB', also: ['most significant bit'], m: 'Most significant bit: the bit with the largest value; in a signed number it holds the sign.', l: [16] },
    { t: 'signal type', also: ['ComSignalType'], m: 'The data type of a signal in the RTE: BOOLEAN, UINT8 … UINT64, SINT8 … SINT64, FLOAT32, FLOAT64, UINT8_N or UINT8_DYN.', l: [17] },
    { t: 'sign extension', m: 'When a signed signal is read, COM copies its sign bit into the higher bits of the larger variable, so a negative value stays negative.', l: [17] },
    { t: 'UINT8_N', m: 'Signal type: a byte array of fixed length.', l: [17] },
    // Added during the conversion
    { t: "REPLACE", m: "Action on a timeout (ComRxDataTimeoutAction) or on a received data invalid value (ComDataInvalidAction): the signal gets its init value.", l: [6, 7] },
    { t: "SUBSTITUTE", m: "Action on a timeout (ComRxDataTimeoutAction): the signal gets its timeout substitution value.", l: [6] },
    { t: "timeout substitution value", also: ["ComTimeoutSubstitutionValue", "substitution value"], m: "A configured value that a signal gets when its reception deadline monitoring times out and the action is SUBSTITUTE.", l: [6] },
    { t: "transmit confirmation", also: ["transmission confirmation"], m: "The report from the lower layers (via the PduR, Com_TxConfirmation) that an I-PDU was transmitted.", l: [6, 14] },
    { t: "NOTIFY", m: "Data invalid action: COM calls the invalid notification and does not store the data invalid value; a read keeps giving the last valid value.", l: [7] },
    { t: "ALWAYS", m: "Filter algorithm: every value passes.", l: [8] },
    { t: "NEVER", m: "Filter algorithm: no value passes.", l: [8] },
    { t: "MASKED_NEW_DIFFERS_MASKED_OLD", m: "Filter algorithm: a value passes if its masked bits differ from those of the last value that passed (old_value).", l: [8] },
    { t: "MASKED_NEW_EQUALS_X", m: "Filter algorithm: a value passes if its masked bits equal a configured value X.", l: [8] },
    { t: "MASKED_NEW_DIFFERS_X", m: "Filter algorithm: a value passes if its masked bits differ from a configured value X.", l: [8] },
    { t: "NEW_IS_WITHIN", m: "Filter algorithm: a value passes if it lies inside a configured range (min to max).", l: [8] },
    { t: "NEW_IS_OUTSIDE", m: "Filter algorithm: a value passes if it lies outside a configured range (min to max).", l: [8] },
    { t: "ONE_EVERY_N", m: "Filter algorithm: one value in every N (the period) passes; an offset chooses which one.", l: [8] },
    { t: "ComNotification", m: "Notification that a signal or signal group was received (callback <ComUser_CbkRxAck>), or that its transmission was confirmed (<ComUser_CbkTxAck>). Up to R20-11 also the name of the parameter that configures it on the signal or signal group.", l: [9] },
    { t: "ComTimeoutNotification", m: "Notification that deadline monitoring found a timeout, in reception (<ComUser_CbkRxTOut>) or in transmission (<ComUser_CbkTxTOut>). Up to R20-11 also the name of the parameter that configures it on the signal or signal group.", l: [9] },
    { t: "ComInvalidNotification", m: "Notification that the data invalid value of a signal or signal group was received and the ComDataInvalidAction is NOTIFY (callback <ComUser_CbkInv>). Up to R20-11 also the name of the parameter that configures it on the signal or signal group.", l: [9] },
    { t: "ComErrorNotification", m: "Notification that a transmission could not take place because its I-PDU was stopped by Com_IpduGroupStop (callback <ComUser_CbkTxErr>). Up to R20-11 also the name of the parameter that configures it on the signal or signal group.", l: [9] },
    { t: "Rte_COMCbk", also: ["Rte_COMCbkTAck", "Rte_COMCbkTErr", "Rte_COMCbkInv", "Rte_COMCbkRxTOut", "Rte_COMCbkTxTOut", "ComUser_CbkRxAck", "ComUser_CbkTxAck"], m: "The callbacks of the RTE that COM calls for notifications, one per signal or signal group: Rte_COMCbk (received), Rte_COMCbkTAck (transmitted), Rte_COMCbkTErr (transmission error), Rte_COMCbkInv (invalid), Rte_COMCbkRxTOut and Rte_COMCbkTxTOut (timeouts).", l: [9] },
    { t: "COM_SERVICE_NOT_AVAILABLE", m: "Return value of Com_SendSignal, Com_ReceiveSignal and similar COM APIs when the I-PDU of the signal is stopped.", l: [11] },
    { t: "Large Data Path", also: ["ComIPduLargeData"], m: "A way through COM for an I-PDU with exactly one byte-array signal: no packing, conversion or filtering and no copy in COM; the RTE starts each transmission with Com_Transmit. Merged into COM from the former LdCom module in R25-11.", l: [13] },
    { t: "Com_Transmit", m: "COM API with which the RTE requests the transmission of an I-PDU on the Large Data Path.", l: [13] },
    { t: "CanTp", also: ["CAN Transport Layer", "CAN TP"], m: "CAN Transport Layer: the transport protocol on CAN; it splits a large I-PDU into CAN frames and joins them again.", l: [14] },
    { t: "CAN Driver", m: "The module (short name Can) that drives the CAN hardware: writes frames into it and reads them out.", l: [14] },
    { t: "TcpIp", also: ["TCP/IP stack"], m: "The TCP/IP stack of the Classic Platform; SoAd uses its UDP and TCP sockets.", l: [14] },
    { t: "EthIf", also: ["Ethernet Interface"], m: "Ethernet Interface: hands Ethernet frames between TcpIp and the Ethernet Driver.", l: [14] },
    { t: "Ethernet Driver", also: ["Eth"], m: "The module (short name Eth) that drives the Ethernet hardware.", l: [14] },
    { t: "transformer", also: ["SOME/IP transformer"], m: "A module that the RTE calls to serialize data into bytes (and back), for example the SOME/IP transformer.", l: [14] },
    { t: "ComTxIPduUnusedAreasDefault", m: "Parameter: the byte pattern (for example 0xFF) that fills the parts of a transmitted I-PDU that no signal uses.", l: [17] },
    { t: "system description", m: "The ARXML file in which the vehicle manufacturer describes the whole network (ECUs, buses, I-PDUs, signals); the COM configuration of each ECU is derived from it.", l: [15] },
    // Lesson 18: the whole call sequence
    { t: 'Rte_Write', also: ['Rte_Write_VehicleSpeed_Speed'], m: 'RTE API with which an SWC writes a data element of a sender port: Rte_Write_<port>_<data element>. For a signal on the bus it calls Com_SendSignal.', l: [18] },
    { t: 'Rte_Read', also: ['Rte_Read_VehicleSpeed_Speed'], m: 'RTE API with which an SWC reads a data element of a receiver port: Rte_Read_<port>_<data element>. For a signal from the bus the value comes from Com_ReceiveSignal.', l: [18] },
    { t: 'DataReceivedEvent', m: 'RTE event: new data has arrived for a receiver port. The RTE starts the runnable of the SWC that is mapped to it.', l: [18] },
    { t: 'DataSendCompletedEvent', m: 'RTE event: the transmission of a data element was confirmed. The RTE starts the runnable mapped to it; the SWC can ask with Rte_Feedback.', l: [18] },
    { t: 'runnable', also: ['runnable entity'], m: 'A function of an SWC that the RTE starts, inside an OS task, when its event occurs (a timer, received data, …).', l: [18] },
    { t: 'polling mode', also: ['interrupt mode'], m: 'How a driver finds out about finished transmissions and received frames: in interrupt mode the hardware raises an interrupt; in polling mode the driver checks in its main function (for example Can_MainFunction_Read).', l: [18] },
    { t: 'Can_MainFunction_Write', also: ['Can_MainFunction_Read'], m: 'Main functions of the CAN Driver: in polling mode they look for finished transmissions (Write) and received frames (Read) and report them to CanIf.', l: [18] },
    { t: 'CanIf_Transmit', m: 'CanIf API: transmit this I-PDU on CAN. Called by the PduR (or CanTp).', l: [18] },
    { t: 'Can_Write', m: 'CAN Driver API: write this L-PDU (CAN identifier, length, data) into a hardware transmit object (Hth). Returns CAN_BUSY if the hardware has no free buffer.', l: [18] },
    { t: 'CanIf_TxConfirmation', m: 'CanIf callback: the CAN Driver reports that a frame was transmitted.', l: [18] },
    { t: 'CanIf_RxIndication', m: 'CanIf callback: the CAN Driver hands up a received frame.', l: [18] },
    { t: 'PduR_CanIfTxConfirmation', m: 'PduR callback: CanIf reports that an I-PDU was transmitted. The PduR passes it on to COM as Com_TxConfirmation.', l: [18] },
    { t: 'PduR_CanIfRxIndication', m: 'PduR callback: CanIf hands up a received I-PDU. The PduR passes it on to COM as Com_RxIndication.', l: [18] },
    { t: 'SoAd_IfTransmit', m: 'SoAd API: transmit this I-PDU over its socket connection. Called by the PduR.', l: [18] },
    { t: 'TcpIp_UdpTransmit', m: 'TcpIp API: send these bytes as a UDP message from this socket to this remote address.', l: [18] },
    { t: 'EthIf_Transmit', also: ['EthIf_ProvideTxBuffer'], m: 'EthIf APIs: EthIf_ProvideTxBuffer gets a transmit buffer of the Ethernet Driver, EthIf_Transmit sends the filled buffer as an Ethernet frame.', l: [18] },
    { t: 'Eth_Transmit', m: 'Ethernet Driver API: transmit a filled transmit buffer.', l: [18] },
    { t: 'SoAd_MainFunction', m: 'Main function of SoAd. Among other things it gives the transmit confirmations for I-PDUs sent over UDP.', l: [18] },
    { t: 'PduR_SoAdIfTxConfirmation', m: 'PduR callback: SoAd reports that an I-PDU was transmitted. For UDP this means: handed to TcpIp.', l: [18] },
    { t: 'EthIf_RxIndication', m: 'EthIf callback: the Ethernet Driver hands up a received frame. EthIf passes it to the module for its frame type, TcpIp for IP.', l: [18] },
    { t: 'EthIf_MainFunctionRx', m: 'Main function of EthIf: in polling mode it fetches received frames from the Ethernet Driver.', l: [18] },
    { t: 'TcpIp_RxIndication', m: 'TcpIp callback: EthIf hands up a received IP frame.', l: [18] },
    { t: 'SoAd_RxIndication', m: 'SoAd callback: TcpIp hands up the payload received on a socket, with the sender address.', l: [18] },
    { t: 'PduR_SoAdIfRxIndication', m: 'PduR callback: SoAd hands up a received I-PDU. The PduR passes it on to COM as Com_RxIndication.', l: [18] },
    { t: 'CanTp_Transmit', m: 'CanTp API: transmit this large I-PDU of the given total length. CanTp fetches the data piece by piece later.', l: [18] },
    { t: 'CanTp_RxIndication', also: ['CanTp_TxConfirmation'], m: 'CanTp callbacks: CanIf hands up a received frame for CanTp, or confirms one that CanTp sent.', l: [18] },
    { t: 'PduR_CanTpCopyTxData', also: ['PduR_CanTpCopyRxData', 'PduR_CanTpStartOfReception', 'PduR_CanTpRxIndication', 'PduR_CanTpTxConfirmation'], m: 'PduR callbacks for CanTp. The PduR passes each on to COM with the same name: Com_CopyTxData, Com_CopyRxData, Com_StartOfReception, Com_TpRxIndication, Com_TpTxConfirmation.', l: [18] },
    { t: 'Com_CopyTxData', m: 'COM callback: the transport protocol asks COM to copy the next bytes of a large I-PDU into its buffer.', l: [13, 18] },
    { t: 'Com_TpTxConfirmation', m: 'COM callback: the transport protocol reports that the whole large I-PDU was transmitted (or not).', l: [13, 18] },
    { t: 'Com_StartOfReception', m: 'COM callback: the transport protocol announces a large I-PDU and its total length. COM answers whether it has room for it.', l: [13, 18] },
    { t: 'Com_CopyRxData', m: 'COM callback: the transport protocol hands COM the next received bytes of a large I-PDU.', l: [13, 18] },
    { t: 'Com_TpRxIndication', m: 'COM callback: the transport protocol reports that the large I-PDU was received completely (or not).', l: [13, 18] },
    { t: 'BUFREQ_OK', m: 'Return value of the copy and start-of-reception callbacks: the request was served.', l: [18] },
    { t: 'first frame', also: ['consecutive frame', 'flow control frame', 'FF', 'CF', 'FC'], m: 'The frames of a CanTp transmission: the first frame (FF) carries the total length and the first bytes, the receiver answers with a flow control frame (FC), then consecutive frames (CF) carry the rest.', l: [18] },
    { t: 'IpduM', also: ['I-PDU Multiplexer'], m: 'I-PDU Multiplexer: a module beside the PduR that puts several I-PDUs into one container I-PDU, or chooses between layouts of one I-PDU.', l: [18] },
    { t: 'SecOC', also: ['Secure Onboard Communication'], m: 'Secure Onboard Communication: a module beside the PduR that adds an authenticator (MAC and freshness value) to an I-PDU and checks it on reception.', l: [18] },
    { t: 'LdCom', also: ['Large Data COM'], m: 'Large Data COM: a slim module next to COM for I-PDUs that are serialized above it, for example by a transformer. It has no signals of its own. Up to R24-11; R25-11 merged it into COM as the Large Data Path.', l: [13, 18] },
    // Reference: COM's interfaces
    { t: 'COM user', also: ['ComUser', 'SwCluC'], m: 'A module that calls COM to send and receive signals and gets its notifications: the RTE, or SwCluC (the software cluster connection) in a system made of software clusters (from R21-11 on).', l: [] },
    { t: 'BSW Scheduler', also: ['SchM'], m: 'The part of the RTE that calls the main functions of the basic software modules from OS tasks, at their configured periods.', l: [] },
    { t: 'Det', also: ['Default Error Tracer', 'Det_ReportError', 'Det_ReportRuntimeError'], m: 'Default Error Tracer: receives development and runtime errors that modules report with Det_ReportError and Det_ReportRuntimeError.', l: [] },
    { t: 'Dem', also: ['Diagnostic Event Manager', 'Dem_SetEventStatus'], m: 'Diagnostic Event Manager: stores diagnostic events. COM reports its deadline monitoring timeouts there with Dem_SetEventStatus, if COM_E_TIMEOUT is configured (from R25-11 on).', l: [] },
    { t: 'Com_Init', also: ['Com_DeInit'], m: 'COM APIs that start and stop the module. After Com_Init all I-PDU groups are still stopped; Com_DeInit stops them all.', l: [] },
    { t: 'Com_EnableReceptionDM', also: ['Com_DisableReceptionDM'], m: 'COM APIs that switch reception deadline monitoring on or off for all I-PDUs of an I-PDU group.', l: [] },
    { t: 'Com_SwitchIpduTxMode', m: 'COM API that selects the true or false transmission mode of an I-PDU from outside COM.', l: [] },
    { t: 'Com_TriggerIPDUSend', m: 'COM API that requests one transmission of a whole I-PDU now, independent of its signals.', l: [] },
    { t: 'Com_GetStatus', also: ['Com_GetVersionInfo'], m: 'COM APIs that return whether COM is initialised, and its version.', l: [] },
    { t: 'PduR_ComCancelTransmit', m: 'PduR API with which COM cancels an ongoing transmission of an I-PDU (ComIPduCancellationSupport).', l: [] },
    { t: 'I-PDU callout', also: ['ComIPduCallout', 'ComIPduTriggerTransmitCallout'], m: 'A function written for the project that COM calls for an I-PDU on transmission or reception. If it returns false, COM does not process the I-PDU further.', l: [] },
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
